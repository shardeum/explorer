import { fetcher } from './fetcher'
import { PATHS } from './paths'
import useSWR from 'swr'
import { NetworkAccount } from '../../types'

export type NetworkAccountResult = {
  networkAccount: NetworkAccount
  loading: boolean
}

export const useNetworkAccount = (): NetworkAccountResult => {
  const { data } = useSWR<{
    networkAccount: NetworkAccount
  }>(PATHS.NETWORK_ACCOUNT, fetcher, { refreshInterval: 10000 })

  return {
    networkAccount: data?.networkAccount,
    loading: !data,
  }
}
