<<<<<<< HEAD
import NotificationsCard from '@components/NotificationsCard'
import NotifiPreviewCard from '@components/NotificationsCard/NotifiPreviewCard'
import { EndpointTypes } from '@models/types'
import {
  BlockchainEnvironment,
  Source,
  useNotifiClient,
} from '@notifi-network/notifi-react-hooks'
import { firstOrNull } from '@utils/helpers'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useState } from 'react'
import useWalletStore from 'stores/useWalletStore'
=======
import { EndpointTypes } from '@models/types'
import { Source } from '@notifi-network/notifi-core'
import {
  BlockchainEnvironment,
  useNotifiClient,
} from '@notifi-network/notifi-react-hooks'
import { useRouter } from 'next-router-mock'
import React, { useCallback, useEffect, useState } from 'react'
import useWalletStore from 'stores/useWalletStore'
import NotificationsCard from '.'
import NotifiPreviewCard from './NotifiPreviewCard'
>>>>>>> 391e202 (begins refactoring for flow)

type Props = {
  onBackClick: () => void
}

const NotificationCardContainer: React.FC<Props> = ({ onBackClick }) => {
  const [showPreview, setPreview] = useState(true)
  const router = useRouter()

  const { cluster } = router.query

  const endpoint = cluster ? (cluster as EndpointTypes) : 'mainnet'
  const wallet = useWalletStore((s) => s.current)
  const connected = useWalletStore((s) => s.connected)
  let env = BlockchainEnvironment.MainNetBeta

  switch (endpoint) {
    case 'mainnet':
      break
    case 'devnet':
      env = BlockchainEnvironment.DevNet
      break
    case 'localnet':
      env = BlockchainEnvironment.LocalNet
      break
  }
  const notifiClient = useNotifiClient({
    dappAddress: 'solanarealmsdao',
    env,
    walletPublicKey: wallet?.publicKey?.toString() ?? '',
  })

<<<<<<< HEAD
  const {
    data,
    isAuthenticated,
    getConfiguration,
    deleteAlert,
    isInitialized,
  } = notifiClient
=======
  const { data, isAuthenticated, getConfiguration, deleteAlert } = notifiClient
>>>>>>> 391e202 (begins refactoring for flow)

  const [email, setEmail] = useState<string>('')
  const [phoneNumber, setPhone] = useState<string>('')
  const [telegram, setTelegram] = useState<string>('')
  const [telegramEnabled, setTelegramEnabled] = useState<boolean>(false)

  useEffect(() => {
    const targetGroup = firstOrNull(data?.targetGroups)
    if (targetGroup) {
      setEmail(firstOrNull(targetGroup?.emailTargets)?.emailAddress ?? '')
      setPhone(firstOrNull(targetGroup?.smsTargets)?.phoneNumber ?? '')
      setTelegram(firstOrNull(targetGroup?.telegramTargets)?.telegramId ?? '')
    } else {
      setEmail(firstOrNull(data?.emailTargets)?.emailAddress ?? '')
      setPhone(firstOrNull(data?.smsTargets)?.phoneNumber ?? '')
      setTelegram(firstOrNull(data?.telegramTargets)?.telegramId ?? '')
    }
  }, [data])

  const updateTelegramSupported = useCallback(async () => {
    const { supportedTargetTypes } = await getConfiguration()
    const telegram = supportedTargetTypes.find(
      (targetType) => targetType === 'TELEGRAM'
    )
    setTelegramEnabled(telegram !== undefined)
  }, [getConfiguration, setTelegramEnabled])

  useEffect(() => {
    updateTelegramSupported().catch((e) => {
      console.error('Failed to get supported type information: ', e)
    })
  }, [updateTelegramSupported])

<<<<<<< HEAD
  useEffect(() => {
    if (isAuthenticated && connected && isInitialized) {
=======
  const firstOrNull = <T,>(
    arr: ReadonlyArray<T> | null | undefined
  ): T | null => {
    if (arr !== null && arr !== undefined) {
      return arr[0] ?? null
    }
    return null
  }

  useEffect(() => {
    if (isAuthenticated && connected) {
>>>>>>> 391e202 (begins refactoring for flow)
      const targetGroup = firstOrNull(data?.targetGroups)

      if (targetGroup) {
        setEmail(firstOrNull(targetGroup?.emailTargets)?.emailAddress ?? '')
        setPhone(firstOrNull(targetGroup?.smsTargets)?.phoneNumber ?? '')
        setTelegram(firstOrNull(targetGroup?.telegramTargets)?.telegramId ?? '')
      } else {
        setEmail(firstOrNull(data?.emailTargets)?.emailAddress ?? '')
        setPhone(firstOrNull(data?.smsTargets)?.phoneNumber ?? '')
        setTelegram(firstOrNull(data?.telegramTargets)?.telegramId ?? '')
      }
<<<<<<< HEAD
    }

    // Handles when the alerts.length is the same as sources
    if (data?.alerts && data.alerts.length === data?.sources.length) {
      if (email || phoneNumber || telegram) {
        setPreview(true)
      }
    }
  }, [
    connected,
    data,
    email,
    isAuthenticated,
    setPreview,
    isInitialized,
    phoneNumber,
    telegram,
  ])

  const handleDelete = useCallback(
=======

      if (email || phoneNumber || telegram) {
        setPreview(true)
        return
      }
    }
    setPreview(false)
  }, [connected, data, email, isAuthenticated, phoneNumber, telegram])

  const handleUnsubscribe = useCallback(
>>>>>>> 391e202 (begins refactoring for flow)
    async (source: Source) => {
      try {
        if (data?.alerts) {
          const sourceId = source.id
          const alertToDelete = data.alerts?.find((alert) =>
            alert.sourceGroup.sources.find((source) => source.id === sourceId)
          )

          alertToDelete?.id &&
            (await deleteAlert({
              alertId: alertToDelete.id,
              keepSourceGroup: true,
              keepTargetGroup: true,
            }))
        }
      } catch (e) {
        throw new Error(e)
      }
    },
    [data?.alerts, deleteAlert]
  )

<<<<<<< HEAD
  return (
    <div className="h-[507px] w-[446px] absolute -top-4 right-0">
      <div className="bg-bkg-5 w-full h-full rounded-lg">
        <div className="flex flex-row w-full items-center align-center">
          {!isInitialized && (
            <div className="h-[576px] pt-10 w-full px-4">
              <div className="space-y-2 align-center items-center w-full mb-2">
                <div className="animate-pulse bg-bkg-4 w-full h-12 rounded-md" />
                <div className="animate-pulse bg-bkg-4 w-full h-12 rounded-md" />
                <div className="animate-pulse bg-bkg-4 w-full h-12 rounded-md" />
                <div className="animate-pulse bg-bkg-4 w-full h-12 rounded-md" />
              </div>
              <div className="space-y-2 align-center items-center w-full">
                <div className="animate-pulse bg-bkg-4 w-full h-12 rounded-md" />
                <div className="animate-pulse bg-bkg-4 w-full h-12 rounded-md" />
                <div className="animate-pulse bg-bkg-4 w-full h-12 rounded-md" />
                <div className="animate-pulse bg-bkg-4 w-full h-12 rounded-md" />
              </div>
            </div>
          )}
          {showPreview && isInitialized && (
            <NotifiPreviewCard
              handleDelete={handleDelete}
              email={email}
              // this passes down useNotiClientData
              {...notifiClient}
              phoneNumber={phoneNumber}
              telegram={telegram}
              telegramEnabled={telegramEnabled}
              onBackClick={onBackClick}
              onClick={() => setPreview(false)}
            />
          )}
          {!showPreview && isInitialized && (
            <NotificationsCard
              phoneNumber={phoneNumber}
              email={email}
              telegram={telegram}
              setPhone={setPhone}
              setTelegram={setTelegram}
              setEmail={setEmail}
              // this passes down useNotiClientData
              {...notifiClient}
              onBackClick={onBackClick}
              setPreview={setPreview}
            />
          )}
        </div>
      </div>
    </div>
=======
  return showPreview ? (
    <NotifiPreviewCard
      handleDelete={handleUnsubscribe}
      email={email}
      // this passes down useNotiClientData
      {...notifiClient}
      phoneNumber={phoneNumber}
      telegram={telegram}
      telegramEnabled={telegramEnabled}
      onClick={() => setPreview(false)}
    />
  ) : (
    <NotificationsCard
      phoneNumber={phoneNumber}
      email={email}
      telegram={telegram}
      setPhone={setPhone}
      setTelegram={setTelegram}
      setEmail={setEmail}
      // this passes down useNotiClientData
      {...notifiClient}
      onBackClick={onBackClick}
      setPreview={setPreview}
    />
>>>>>>> 391e202 (begins refactoring for flow)
  )
}

export default NotificationCardContainer
