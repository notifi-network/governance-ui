import useRealm from '../../hooks/useRealm'
import useWalletStore from '../../stores/useWalletStore'
import Button from '../Button'
import Input from '../inputs/Input'
import { isValidNumber } from 'libphonenumber-js'

import React, {
  FunctionComponent,
  useEffect,
  useState,
  Dispatch,
  SetStateAction,
} from 'react'
import {
  ArrowLeftIcon,
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
import PhoneInput from './PhoneInput'

const firstOrNull = <T,>(
  arr: ReadonlyArray<T> | null | undefined
): T | null => {
  if (arr !== null && arr !== undefined) {
    return arr[0] ?? null
  }
  return null
}

type NotificationCardProps = {
  onBackClick?: () => void
  setPreview?: Dispatch<SetStateAction<boolean>>
}

const NotificationsCard = ({
  onBackClick,
  setPreview,
}: NotificationCardProps) => {
  const router = useRouter()
  const { cluster } = router.query
  const { realm } = useRealm()
  const [isLoading, setLoading] = useState<boolean>(false)
  const [hasUnsavedChanges, setUnsavedChanges] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [telegramEnabled, setTelegramEnabled] = useState<boolean>(false)

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
  const {
    data,
    logIn,
    fetchData,
    isAuthenticated,
    createAlert,
    updateAlert,
    getConfiguration,
  } = useNotifiClient({
    dappAddress: 'solanarealmsdao',
    walletPublicKey: wallet?.publicKey?.toString() ?? '',
    env,
  })

  // TO DO, add solanarealmsdao to signature or add to pubkey
  const [email, setEmail] = useState<string>('')
  const [phoneNumber, setPhone] = useState<string>('')
  const [telegram, setTelegram] = useState<string>('')

  const targetGroup = firstOrNull(data?.targetGroups)
  const originalPhoneNumber = firstOrNull(targetGroup?.smsTargets)?.phoneNumber

  //when creating source group, we need a special value
  // we know which ones are there

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

    //Filter sources
    // we won't get back any data from soures if we're not a part of any dao.

    const targetGroup = firstOrNull(data?.targetGroups)
    setEmail(firstOrNull(targetGroup?.emailTargets)?.emailAddress ?? '')

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

  const handleRefresh = async function () {
    setLoading(true)
    setErrorMessage('')
    // user is not authenticated
    if (!isAuthenticated() && wallet && wallet.publicKey) {
      try {
        await logIn((wallet as unknown) as MessageSigner)
        setPreview?.(true)
      } catch (e) {
        handleError([e])
      }
      setLoading(false)
    }
    setLoading(false)
  }

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
            phoneNumber: !isValidNumber(phoneNumber) ? null : phoneNumber,
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
        } else {
          const alertResult = await createAlert({
            name: `${realm?.account.name} notifications`,
            emailAddress: email === '' ? null : email,
            phoneNumber: !isValidNumber(phoneNumber) ? null : phoneNumber,
            telegramId: telegram === '' ? null : telegram,
            sourceId: source?.id ?? '',
            filterId: filter?.id ?? '',
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
        onBackClick?.()
        setPreview?.(true)
        setUnsavedChanges(false)
      } catch (e) {
        handleError([e])
      }
    }
    setLoading(false)
  }

  const handleEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    setUnsavedChanges(true)
  }

  const handlePhone = (input: string) => {
    setPhone(input)
    setUnsavedChanges(true)
  }

  const handleTelegram = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTelegram(e.target.value)
    setUnsavedChanges(true)
  }

  const disabled = isAuthenticated() && !hasUnsavedChanges

  return (
    <div className="bg-bkg-5 p-4 md:p-6 rounded-lg shadow-lg ">
      <div className=" flex flex-row items-center align-center">
        <Button className="bg-transparent" onClick={onBackClick}>
          <ArrowLeftIcon fill="grey" className="w-6 h-6" />
        </Button>
        <NotifiFullLogo />
      </div>
      {!connected ? (
        <>
          <div className="text-sm text-th-fgd-1">
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
                <MailIcon className="z-10 h-10 text-primary-light w-7 mr-1 mt-9 absolute left-3.5" />
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
            <PhoneInput
              handlePhone={handlePhone}
              phoneNumber={originalPhoneNumber!}
            />
            {telegramEnabled && (
              <InputRow
                label="Telegram"
                icon={
                  <PaperAirplaneIcon
                    className="z-10 h-10 text-primary-light w-7 mr-1 mt-8 absolute left-3"
                    style={{ transform: 'rotate(45deg)' }}
                  />
                }
              >
                <Input
                  className="min-w-11/12 py-3 px-4 appearance-none w-11/12 pl-14 outline-0 focus:outline-none flex"
                  type="text"
                  value={telegram}
                  onChange={handleTelegram}
                  placeholder="Telegram ID"
                />
              </InputRow>
            )}
          </div>
          <div className=" text-xs  place-items-center  align-items-center grid flex-row text-center">
            <div className="w-full place-items-center ">
              Already Subscribed?
              <a
                onClick={handleRefresh}
                rel="noreferrer"
                className="text-xs text-primary-dark cursor-pointer "
                title="Click here to load your alert details."
              >
                {` `} Click here to load your alert details.
              </a>
            </div>
          </div>
          <div className="flex flex-col space-y-4 mt-4 items-center justify-content-center align-items-center">
            <Button
              tooltipMessage={
                disabled
                  ? 'No unsaved changes!'
                  : isAuthenticated()
                  ? 'Save settings for notifications'
                  : 'Fetch stored values for existing accounts'
              }
              className="w-11/12"
              disabled={disabled}
              onClick={handleSave}
              isLoading={isLoading}
            >
              Subscribe
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
      )}
    </div>
  )
}

interface InputRowProps {
  label: string
  icon: React.ReactNode
}

export const InputRow: FunctionComponent<InputRowProps> = ({
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
