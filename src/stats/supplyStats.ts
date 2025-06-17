import { config } from '../config/index'
import * as db from '../storage/sqlite3storage'
import * as statsDb from './sqlite3storage'
import { InternalTXType, TransactionType } from '../types'
import BN from 'bn.js'
import * as Cycle from '../storage/cycle'

const BASE_SUPPLY = 249_000_000

export interface SupplyStats {
  circulatingSupply: number
  totalShmRewarded: number
  totalShmBurned: number
}

export interface SupplyStatsCache {
  id?: number
  lastCycle: number
  circulatingSupply: number
  totalShmRewarded: number
  totalShmBurned: number
  lastUpdated: number
}


function hexToSHM(hexStr: string): number {
  if (!hexStr || hexStr === '0x0') return 0
  try {
    const bn = new BN(hexStr.replace('0x', ''), 16)
    return parseFloat(bn.toString()) / 1e18
  } catch (e) {
    console.error('Error converting hex to SHM:', e)
    return 0
  }
}


export async function calculateSecureAccountsBalance(): Promise<number> {
  try {
    if (!config.secureAccounts || config.secureAccounts.length === 0) {
      if (config.verbose) console.log('No secure accounts configured')
      return 0
    }
    
    const placeholders = config.secureAccounts.map(() => '?').join(', ')
    const sql = `
      SELECT 
        ethAddress,
        json_extract(account, '$.account.balance.value') as balance
      FROM accounts 
      WHERE LOWER(ethAddress) IN (${placeholders})
    `
    
    const results: Array<{ ethAddress: string; balance: string }> = await db.all(sql, config.secureAccounts.map(acc => acc.toLowerCase()))
    
    let totalBalanceShm = 0
    for (const row of results) {
      if (row.balance) {
        // Balance is stored as a decimal string, not hex
        // Convert from wei to SHM (18 decimals)
        const balanceWei = parseFloat(row.balance)
        const balanceShm = balanceWei / 1e18
        totalBalanceShm += balanceShm
        
        if (config.verbose) {
          console.log(`Secure account ${row.ethAddress}: ${balanceShm} SHM`)
        }
      }
    }
    
    if (config.verbose) console.log('Total SHM in secure accounts:', totalBalanceShm)
    return totalBalanceShm
  } catch (e) {
    console.error('Error calculating secure accounts balance:', e)
    return 0
  }
}

export async function getCachedSupplyStats(): Promise<SupplyStatsCache | null> {
  try {
    const sql = `SELECT * FROM supply_stats_cache ORDER BY lastCycle DESC LIMIT 1`
    const cache: SupplyStatsCache | undefined = await statsDb.get(sql)
    return cache || null
  } catch (e) {
    console.error('Error getting cached supply stats:', e)
    return null
  }
}

export async function saveSupplyStatsCache(stats: SupplyStatsCache): Promise<void> {
  try {
    await statsDb.run(`DELETE FROM supply_stats_cache`)
    
    const sql = `
      INSERT INTO supply_stats_cache (lastCycle, circulatingSupply, totalShmRewarded, totalShmBurned, lastUpdated)
      VALUES (?, ?, ?, ?, ?)
    `
    await statsDb.run(sql, [
      stats.lastCycle,
      stats.circulatingSupply,
      stats.totalShmRewarded,
      stats.totalShmBurned,
      stats.lastUpdated
    ])
    
    if (config.verbose) console.log('Saved supply stats cache for cycle:', stats.lastCycle)
  } catch (e) {
    console.error('Error saving supply stats cache:', e)
  }
}

export async function calculateTotalShmRewardedFromCycle(startCycle?: number): Promise<number> {
  try {
    let sql = `
      SELECT json_extract(wrappedEVMAccount, '$.balance') as rewardAmount
      FROM transactions 
      WHERE transactionType = ? 
      AND internalTXType = ?
      AND json_extract(wrappedEVMAccount, '$.readableReceipt.status') = 1
    `
    const params: any[] = [TransactionType.InternalTxReceipt, InternalTXType.ClaimReward]
    
    if (startCycle !== undefined) {
      sql += ` AND cycle > ?`
      params.push(startCycle)
    }
    
    const results: Array<{ rewardAmount: string }> = await db.all(sql, params)
    
    let totalRewardedShm = 0
    for (const row of results) {
      if (row.rewardAmount) {
        totalRewardedShm += hexToSHM(row.rewardAmount)
      }
    }
    
    if (config.verbose) console.log('Total SHM rewarded from cycle', startCycle || 0, ':', totalRewardedShm)
    return totalRewardedShm
  } catch (e) {
    console.error('Error calculating total SHM rewarded from cycle:', e)
    return 0
  }
}

export async function calculateTotalShmBurnedFromCycle(startCycle?: number): Promise<number> {
  try {
    let totalBurnedShm = 0
    
    let regularTxSql = `
      SELECT SUM(
        CAST(json_extract(wrappedEVMAccount, '$.readableReceipt.gasUsed') AS REAL) * 
        CAST(json_extract(wrappedEVMAccount, '$.readableReceipt.effectiveGasPrice') AS REAL)
      ) as totalBurned
      FROM transactions 
      WHERE json_extract(wrappedEVMAccount, '$.readableReceipt.status') = 1
      AND transactionType IN (?, ?, ?)
    `
    const regularTxParams: any[] = [
      TransactionType.Receipt,
      TransactionType.StakeReceipt,
      TransactionType.UnstakeReceipt
    ]
    
    if (startCycle !== undefined) {
      regularTxSql += ` AND cycle > ?`
      regularTxParams.push(startCycle)
    }
    
    const regularTxResult: { totalBurned: number } | undefined = await db.get(regularTxSql, regularTxParams)
    
    const regularTxBurnedWei = regularTxResult?.totalBurned || 0
    totalBurnedShm += regularTxBurnedWei / 1e18
    
    let internalTxSql = `
      SELECT json_extract(wrappedEVMAccount, '$.amountSpent') as amountSpent
      FROM transactions 
      WHERE transactionType = ?
      AND internalTXType != ?
      AND json_extract(wrappedEVMAccount, '$.readableReceipt.status') = 1
    `
    const internalTxParams: any[] = [
      TransactionType.InternalTxReceipt,
      InternalTXType.TransferFromSecureAccount
    ]
    
    if (startCycle !== undefined) {
      internalTxSql += ` AND cycle > ?`
      internalTxParams.push(startCycle)
    }
    
    const internalTxResults: Array<{ amountSpent: string }> = await db.all(internalTxSql, internalTxParams)
    
    for (const row of internalTxResults) {
      if (row.amountSpent) {
        totalBurnedShm += hexToSHM(row.amountSpent)
      }
    }
    
    if (config.verbose) console.log('Total SHM burned from cycle', startCycle || 0, ':', totalBurnedShm)
    return totalBurnedShm
  } catch (e) {
    console.error('Error calculating total SHM burned from cycle:', e)
    return 0
  }
}

export async function updateSupplyStatsCache(): Promise<void> {
  try {
    const latestCycleRecords = await Cycle.queryLatestCycleRecords(1)
    const latestCycle = latestCycleRecords.length > 0 ? latestCycleRecords[0].counter : 0
    
    const cache = await getCachedSupplyStats()
    
    let totalShmRewarded = 0
    let totalShmBurned = 0
    
    if (cache && cache.lastCycle < latestCycle) {
      if (config.verbose) console.log(`Updating cache from cycle ${cache.lastCycle} to ${latestCycle}`)
      
      const [incrementalRewarded, incrementalBurned] = await Promise.all([
        calculateTotalShmRewardedFromCycle(cache.lastCycle),
        calculateTotalShmBurnedFromCycle(cache.lastCycle)
      ])
      
      totalShmRewarded = cache.totalShmRewarded + incrementalRewarded
      totalShmBurned = cache.totalShmBurned + incrementalBurned
    } else if (!cache) {
      if (config.verbose) console.log('No cache found, calculating supply stats from scratch')
      
      const results = await Promise.all([
        calculateTotalShmRewardedFromCycle(0),
        calculateTotalShmBurnedFromCycle(0)
      ])
      totalShmRewarded = results[0]
      totalShmBurned = results[1]
    } else {
      if (config.verbose) console.log('Cache is already up to date')
      return
    }
    
    const secureAccountsBalance = await calculateSecureAccountsBalance()
    
    const circulatingSupply = BASE_SUPPLY - totalShmBurned + totalShmRewarded - secureAccountsBalance
    
    await saveSupplyStatsCache({
      lastCycle: latestCycle,
      circulatingSupply,
      totalShmRewarded,
      totalShmBurned,
      lastUpdated: Date.now()
    })
    
    console.log(`Supply stats cache updated for cycle ${latestCycle}`)
  } catch (e) {
    console.error('Error updating supply stats cache:', e)
  }
}


export async function getSupplyStats(): Promise<SupplyStats> {
  try {
    const cache = await getCachedSupplyStats()
    
    if (!cache) {
      await updateSupplyStatsCache()
      const newCache = await getCachedSupplyStats()
      if (newCache) {
        return {
          circulatingSupply: newCache.circulatingSupply,
          totalShmRewarded: newCache.totalShmRewarded,
          totalShmBurned: newCache.totalShmBurned
        }
      }
      throw new Error('Failed to create supply stats cache')
    }
    
    return {
      circulatingSupply: cache.circulatingSupply,
      totalShmRewarded: cache.totalShmRewarded,
      totalShmBurned: cache.totalShmBurned
    }
  } catch (e) {
    console.error('Error getting supply stats:', e)
    throw e
  }
}