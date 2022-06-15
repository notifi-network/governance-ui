import useRealm from '../../hooks/useRealm'
import useWalletStore from '../../stores/useWalletStore'
import Button from '../Button'
import Input from '../inputs/Input'
import React, { FunctionComponent, useEffect, useState } from 'react'
import {
  ArrowLeftIcon,
  ChatAltIcon,
  MailIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/solid'
import {
  BlockchainEnvironment,
  GqlError,
  MessageSigner,
  useNotifiClient,
} from '@notifi-network/notifi-react-hooks'
import { useRouter } from 'next/router'
import { EndpointTypes } from '@models/types'
import { useCallback } from 'react'
import NotifiFullLogo from './NotifiFullLogo'

const firstOrNull = <T,>(
  arr: ReadonlyArray<T> | null | undefined
): T | null => {
  if (arr !== null && arr !== undefined) {
    return arr[0] ?? null
  }
  return null
}

type NotificationCardProps = {
  onBackClick: () => void
  email: string

  phoneNumber: string
  telegram: string
  setPreview: Dispatch<SetStateAction<boolean>>
  setEmail: Dispatch<SetStateAction<string>>
  setTelegram: Dispatch<SetStateAction<string>>
  setPhone: Dispatch<SetStateAction<string>>
} & Pick<
  NotifiClientReturnType,
  | 'createAlert'
  | 'logIn'
  | 'fetchData'
  | 'data'
  | 'isAuthenticated'
  | 'updateAlert'
  | 'getConfiguration'
>

const NotificationsCard = ({
  createAlert,
  data,
  email,
  getConfiguration,
  isAuthenticated,
  logIn,
  onBackClick,
  phoneNumber,
  setEmail,
  setPhone,
  setPreview,
  setTelegram,
  telegram,
  updateAlert,
}: NotificationCardProps) => {
  const [isLoading, setLoading] = useState<boolean>(false)
  const [hasUnsavedChanges, setUnsavedChanges] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [telegramEnabled, setTelegramEnabled] = useState<boolean>(false)

  const wallet = useWalletStore((s) => s.current)
  const connected = useWalletStore((s) => s.connected)
  const endpoint = cluster ? (cluster as EndpointTypes) : 'mainnet'
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
  const {
    data,
    logIn,
    fetchData,
    isAuthenticated,
    createAlert,
    updateAlert,
    getConfiguration,
  } = useNotifiClient({
    dappAddress: realm?.pubkey?.toBase58() ?? '',
    walletPublicKey: wallet?.publicKey?.toString() ?? '',
    env,
  })

  const [email, setEmail] = useState<string>('')
  const [phone, setPhone] = useState<string>('')
  const [telegram, setTelegram] = useState<string>('')

  const updateTelegramSupported = useCallback(async () => {
    const { supportedTargetTypes } = await getConfiguration()
    const telegram = supportedTargetTypes.find((it) => it === 'TELEGRAM')
    setTelegramEnabled(telegram !== undefined)
  }, [getConfiguration, setTelegramEnabled])

  useEffect(() => {
    // can't use async with useEffect
    updateTelegramSupported().catch((e) => {
      console.error('Failed to get supported type information: ', e)
    })
  }, [updateTelegramSupported])

  useEffect(() => {
    // Update state when server data changes
    const targetGroup = firstOrNull(data?.targetGroups)
    setEmail(firstOrNull(targetGroup?.emailTargets)?.emailAddress ?? '')
    setPhone(firstOrNull(targetGroup?.smsTargets)?.phoneNumber ?? '')
    setTelegram(firstOrNull(targetGroup?.telegramTargets)?.telegramId ?? '')
  }, [data])

  const handleError = (errors: { message: string }[]) => {
    const error = errors.length > 0 ? errors[0] : null
    if (error instanceof GqlError) {
      setErrorMessage(
        `${error.message}: ${error.getErrorMessages().join(', ')}`
      )
    } else {
      setErrorMessage(error?.message ?? 'Unknown error')
    }
    setLoading(false)
  }

  const handleRefresh = useCallback(
    async function () {
      setLoading(true)
      setErrorMessage('')
      // user is not authenticated
      if (!isAuthenticated && wallet && wallet.publicKey) {
        try {
          await logIn((wallet as unknown) as MessageSigner)
        } catch (e) {
          handleError([e])
        }
        setLoading(false)
      }
      setLoading(false)
    },
    [setLoading, isAuthenticated, wallet, setErrorMessage, logIn]
  )

  const handleSave = async function () {
    setLoading(true)

    let localData = data
    // user is not authenticated
    if (!isAuthenticated() && wallet && wallet.publicKey) {
      try {
        await logIn((wallet as unknown) as MessageSigner)
        localData = await fetchData()
      } catch (e) {
        handleError([e])
      }
    }

    const alert = firstOrNull(localData?.alerts)
    const source = firstOrNull(localData?.sources)
    const filter = firstOrNull(localData?.filters)
    if (connected && isAuthenticated()) {
      try {
        if (alert !== null) {
          const alertResult = await updateAlert({
            alertId: alert.id ?? '',
            emailAddress: email === '' ? null : email,
            phoneNumber: phone.length < 12 ? null : phone,
            telegramId: telegram === '' ? null : telegram,
          })

          if (alertResult) {
            if (alertResult.targetGroup?.telegramTargets?.length > 0) {
              const target = alertResult.targetGroup?.telegramTargets[0]
              if (target && !target.isConfirmed) {
                if (target.confirmationUrl) {
                  window.open(target.confirmationUrl)
                }
              }
            }
          }
          if (results) {
            setEmail(
              results[0].targetGroup?.emailTargets[0]?.emailAddress ?? ''
            )
            setPhone(results[0].targetGroup?.smsTargets[0]?.phoneNumber ?? '')
            setTelegram(
              results[0].targetGroup?.telegramTargets[0]?.telegramId ?? ''
            )
            setPreview(true)
          }
          checkTelegramUnconfirmed(results)
          if (results) {
            setPreview(true)
          }
        } else {
          const results: Alert[] = []
          if (sources && sources.length >= 1) {
            for (const source of sources) {
              const filterId = source.applicableFilters[0].id
              const alertRes = await createAlert({
                emailAddress: localEmail === '' ? null : localEmail,
                filterId: filterId ?? '',
                name: `${source.name} notification`,
                phoneNumber: isValidPhoneNumber(localPhoneNumber)
                  ? localPhoneNumber
                  : null,
                sourceId: source?.id ?? '',
                telegramId: localTelegram === '' ? null : localTelegram,
              })

          if (alertResult) {
            if (alertResult.targetGroup?.telegramTargets?.length > 0) {
              const target = alertResult.targetGroup?.telegramTargets[0]
              if (target && !target.isConfirmed) {
                if (target.confirmationUrl) {
                  window.open(target.confirmationUrl)
                }
              }
            }
          }
        }
        setUnsavedChanges(false)
      } catch (e) {
        handleError([e])
      }
    }
    setLoading(false)
  }, [
    alerts,
    checkTelegramUnconfirmed,
    connected,
    createAlert,
    isAuthenticated,
    localEmail,
    localPhoneNumber,
    localTelegram,
    logIn,
    setEmail,
    setPhone,
    setPreview,
    setTelegram,
    sources,
    telegram,
    updateAlert,
    wallet,
  ])

  const handleEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    setUnsavedChanges(true)
  }

  const handlePhone = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value
    if (val.length > 1) {
      val = val.substring(2)
    }

    const re = /^[0-9\b]+$/
    if (val === '' || (re.test(val) && val.length <= 10)) {
      setPhone('+1' + val)
    }

    setUnsavedChanges(true)
  }

  const handleTelegram = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTelegram(e.target.value)
    setUnsavedChanges(true)
  }

  const isSame =
    email === localEmail &&
    phoneNumber === localPhoneNumber &&
    telegram === localTelegram

  const disabled =
    (isAuthenticated && !hasUnsavedChanges) ||
    (localEmail === '' && localTelegram === '' && localPhoneNumber === '')

  const handleBackClick = useCallback(() => {
    if (isSame && !disabled) {
      setPreview(true)
      return
    }
    if (disabled) {
      onBackClick()
    } else {
      setPreview(false)
    }
  }, [disabled, isSame, onBackClick, setPreview])

  return (
    <div className="bg-bkg-5 w-full p-4 md:p-6 rounded-lg">
      <div className="flex flex-row items-center align-center">
        <Button className="bg-transparent" onClick={handleBackClick}>
          <ArrowLeftIcon className="w-6 h-6" fill="grey" />
        </Button>
        <NotifiFullLogo />
      </div>
      {!connected ? (
        <>
          <div className="text-sm items-center w-full text-center text-th-fgd-1">
            Connect wallet to see options
          </div>
        </>
      ) : (
        <>
          <div>
            <div className="text-sm text-th-fgd-1 flex flex-row items-center justify-between mt-4">
              Get notifications for proposals, voting, and results. Add your
              email address, phone number, and/or Telegram.
            </div>
          </>
        ) : (
          <>
            <div>
              <div className="text-sm text-th-fgd-1 flex flex-row items-center justify-between mt-4">
                Get notifications for proposals, voting, and results. Add your
                email address, phone number, and/or Telegram.
              </div>
              {errorMessage.length > 0 ? (
                <div className="text-sm text-red">{errorMessage}</div>
              ) : (
                !isAuthenticated() && (
                  <div className="text-sm text-fgd-3">
                    When prompted, sign the transaction.
                  </div>
                )
              )}
            </div>
            <div className="pb-5">
              <InputRow
                label="email"
                icon={
                  <MailIcon className=" z-10 h-10 text-primary-light w-7 mr-1 mt-9 absolute left-3.5" />
                }
              >
                <Input
                  className="min-w-11/12 py-3 px-4 appearance-none w-11/12 pl-14 outline-0 focus:outline-none"
                  type="email"
                  value={email}
                  onChange={handleEmail}
                  placeholder="you@email.com"
                />
              </InputRow>
            )}
          </div>
          <div className=" text-xs  place-items-center  align-items-center grid flex-row text-center">
            <div className="w-full place-items-center ">
              Already Subscribed?{' '}
              <a
                className="text-xs text-primary-dark cursor-pointer "
                onClick={handleRefresh}
                rel="noreferrer"
                title="Click here to load your alert details."
              >
                Click here to load your alert details.
              </a>
            </div>
          </div>
          <div className="flex flex-col space-y-4 mt-4 items-center justify-content-center align-items-center">
            <Button
              className="w-11/12"
              disabled={disabled}
              isLoading={isLoading}
              onClick={handleSave}
              tooltipMessage={
                disabled
                  ? 'No unsaved changes!'
                  : isAuthenticated
                  ? 'Save settings for notifications'
                  : 'Fetch stored values for existing accounts'
              }
            >
              {alerts && alerts.length > 0 ? 'Update' : 'Subscribe'}
            </Button>

            <div className="h-3 grid text-xs w-full place-items-center">
              <a
                className="text-xs text-primary-dark "
                href="https://www.notifi.network/faqs"
                rel="noreferrer"
                target="_blank"
                title="Questions? Click to learn more!"
              >
                {hasUnsavedChanges || isAuthenticated()
                  ? 'Subscribe'
                  : 'Refresh'}
              </Button>

              <div className="h-3 grid text-xs w-full place-items-center">
                <a
                  href="https://www.notifi.network/faqs"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary-dark "
                  title="Questions? Click to learn more!"
                >
                  Learn More About Notifi
                </a>
              </div>
            </div>
          </>
        )
      ) : (
        <div className="flex flex-col items-center">
          <div className="mt-10">
            Please select a DAO to start using Notifi.
          </div>
          <div className="animate-pulse bg-bkg-3 h-12 w-full mb-4 mt-10 rounded-lg" />
          <div className="animate-pulse bg-bkg-3 h-10 w-full mb-4 rounded-lg" />
          <div className="animate-pulse bg-bkg-3 h-10 w-full  mb-4  rounded-lg" />
          <div className="animate-pulse bg-bkg-3 w-1/2 h-10  mb-4 flex rounded-lg" />
        </div>
      )}
    </div>
  )
}

interface InputRowProps {
  label: string
  icon: React.ReactNode
}

const InputRow: FunctionComponent<InputRowProps> = ({
  children,
  label,
  icon,
}) => {
  return (
    <label
      htmlFor={label}
      className="relative text-gray-400 focus-within:text-gray-600 place-items-center left-5"
    >
      {icon}
      <div className="mr-2 text-sm w-40 h-8 flex items-center"></div>
      {children}
    </label>
  )
}

export default NotificationsCard
