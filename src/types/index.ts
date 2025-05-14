export interface NetworkParameters {
  title: string
  description: string
  nodeRewardInterval: number
  nodeRewardAmount: number
  nodePenalty: number
  stakeRequired: number
  maintenanceInterval: number
  maintenanceFee: number
  stabilityScaleMul: number
  stabilityScaleDiv: number
  minVersion: string
  activeVersion: string
  latestVersion: string
  archiver: {
    minVersion: string
    activeVersion: string
    latestVersion: string
  }
  txPause: boolean
  certCycleDuration: number
  enableNodeSlashing: boolean
  qa: {
    qaTestNumber: number
    qaTestBoolean: boolean
    qaTestPercent: number
    qaTestSemver: string
  }
  slashing: {
    enableLeftNetworkEarlySlashing: boolean
    enableSyncTimeoutSlashing: boolean
    enableNodeRefutedSlashing: boolean
    leftNetworkEarlyPenaltyPercent: number
    syncTimeoutPenaltyPercent: number
    nodeRefutedPenaltyPercent: number
  }
  enableRPCEndpoints: boolean
  stakeLockTime: number
  chainID: number
}

export enum DistributorSocketCloseCodes {
  DUPLICATE_CONNECTION_CODE = 1000,
  SUBSCRIBER_EXPIRATION_CODE,
}

export * from './account'
export * from './cycle'
export * from './originalTxData'
export * from './receipt'
export * from './serverResponseTypes'
export * from './transaction'
export * from './websocket'
