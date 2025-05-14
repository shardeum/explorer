import { fetcher } from './fetcher'
import { PATHS } from './paths'
import useSWR from 'swr'
import { NetworkAccount } from '../../types'

export type NetworkAccountResult = {
  networkAccount: NetworkAccount
  loading: boolean
}

export const useNetworkAccount = (): NetworkAccountResult => {
  const { data } = useSWR<NetworkAccount>(PATHS.NETWORK_ACCOUNT, fetcher, { refreshInterval: 10000 })

  return {
    networkAccount: data,
    loading: !data,
  }
}
