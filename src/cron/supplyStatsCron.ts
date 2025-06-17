import cron from 'node-cron'
import { updateSupplyStatsCache } from '../stats/supplyStats'
import { config } from '../config'

let cronJob: cron.ScheduledTask | null = null

export async function startSupplyStatsCron(): Promise<void> {
  if (cronJob) {
    cronJob.stop()
  }

  const { getCachedSupplyStats } = await import('../stats/supplyStats')
  const cache = await getCachedSupplyStats()
  
  if (!cache) {
    console.log('No supply stats cache found. Running initial calculation...')
    try {
      await updateSupplyStatsCache()
      console.log('Initial supply stats calculation completed')
    } catch (error) {
      console.error('Error in initial supply stats calculation:', error)
    }
  } else {
    console.log(`Supply stats cache found (last updated cycle: ${cache.lastCycle})`)
  }

  // Schedule daily updates at 2:00 AM
  cronJob = cron.schedule('0 2 * * *', async () => {
    console.log('Running daily supply stats update...')
    try {
      await updateSupplyStatsCache()
      console.log('Daily supply stats update completed successfully')
    } catch (error) {
      console.error('Error in daily supply stats update:', error)
    }
  })
}

export function stopSupplyStatsCron(): void {
  if (cronJob) {
    cronJob.stop()
    cronJob = null
    console.log('Supply stats cron job stopped')
  }
}

export async function manualUpdateSupplyStats(): Promise<void> {
  console.log('Manually updating supply stats...')
  await updateSupplyStatsCache()
  console.log('Manual supply stats update completed')
}