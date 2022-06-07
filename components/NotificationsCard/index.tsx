import useRealm from '../../hooks/useRealm'
import useWalletStore from '../../stores/useWalletStore'
import Button from '../Button'
import Input from '../inputs/Input'
import React, {
  FunctionComponent,
  useEffect,
  useState,
  Fragment,
  Dispatch,
  SetStateAction,
} from 'react'
import {
  ArrowLeftIcon,
  ChatAltIcon,
  MailIcon,
  PaperAirplaneIcon,
  ChevronDownIcon,
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
import countryData from '@components/NotificationsCard/data'
import { Listbox, Transition } from '@headlessui/react'

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
  onBackClick?: () => void
  setPreview?: Dispatch<SetStateAction<boolean>>
}

const NotificationsCard = ({ onBackClick }: NotificationCardProps) => {
  const router = useRouter()
  const { cluster } = router.query
  const { councilMint, mint, realm } = useRealm()
  const [isLoading, setLoading] = useState<boolean>(false)
  const [hasUnsavedChanges, setUnsavedChanges] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [telegramEnabled, setTelegramEnabled] = useState<boolean>(false)
  const [countryDialCode, setCountryDialCode] = useState<string>('+1')

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
    dappAddress: `solanarealmsdao`,
    walletPublicKey: wallet?.publicKey?.toString() ?? '',
    env,
  })

  // TO DO, add solanarealmsdao to signature or add to pubkey
  const [email, setEmail] = useState<string>('')
  const [phone, setPhone] = useState<string>('')
  const [telegram, setTelegram] = useState<string>('')
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
    const originalPhoneNumber = firstOrNull(targetGroup?.smsTargets)
      ?.phoneNumber

    let possibleCountryCode = ''
    const countryMap = [...viewableCountries]

    if (originalPhoneNumber) {
      for (const letter of originalPhoneNumber) {
        possibleCountryCode += letter
        const searchCountries = countryMap.filter(
          (country) =>
            country.dial_code.includes(possibleCountryCode) &&
            possibleCountryCode === country.dial_code
        )

        if (
          searchCountries.length === 1 ||
          (searchCountries[0] && searchCountries[0].dial_code == '+1')
        ) {
          setCountryDialCode(possibleCountryCode || '+1')
          break
        }
      }
    }

    setPhone(
      firstOrNull(targetGroup?.smsTargets)?.phoneNumber?.substring(
        possibleCountryCode.length,
        originalPhoneNumber?.length
      ) ?? ''
    )
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

    const formattedPhone = `${countryDialCode}` + phone
    const alert = firstOrNull(localData?.alerts)
    const source = firstOrNull(localData?.sources)
    // we can iterate through and see sources available
    const filter = firstOrNull(localData?.filters)
    if (connected && isAuthenticated()) {
      try {
        if (alert !== null) {
          const alertResult = await updateAlert({
            alertId: alert.id ?? '',
            emailAddress: email === '' ? null : email,
            phoneNumber:
              formattedPhone.length < 10 + countryDialCode.length - 1
                ? null
                : formattedPhone,
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
            phoneNumber:
              formattedPhone.length < 10 + countryDialCode.length - 1
                ? null
                : formattedPhone,
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
        setUnsavedChanges(false)
      } catch (e) {
        handleError([e])
      }
    }
    setLoading(false)
  }

  const hasLoaded = mint || councilMint

  const handleEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    setUnsavedChanges(true)
  }

  const handlePhone = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value

    const re = /^[0-9\b]+$/
    if (val === '' || (re.test(val) && val.length <= 10)) {
      setPhone(val)
    }
    setUnsavedChanges(true)
  }

  const handleTelegram = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTelegram(e.target.value)
    setUnsavedChanges(true)
  }

  const disabled = isAuthenticated() && !hasUnsavedChanges
  const allowedCountries = [
    'United States',
    'Australia',
    'Austria',
    'Belgium',
    'Brazil',
    'Canada',
    'Denmark',
    'Finland',
    'France',
    'Germany',
    'Hong Kong',
    'Hungary',
    'Ireland',
    'Malaysia',
    'Norway',
    'Philippines',
    'Poland',
    'Portugal',
    'Singapore',
    'South Korea',
    'Spain',
    'Sweden',
    'Switzerland',
    'Taiwan',
    'United Kingdom',
  ]

  const viewableCountries = [...countryData].filter(({ name }) =>
    allowedCountries.includes(name)
  )

  return (
    <div className="bg-bkg-5 p-4 md:p-6 rounded-lg shadow-lg ">
      <div className=" flex flex-row items-center align-center">
        <Button className="bg-transparent" onClick={onBackClick}>
          <ArrowLeftIcon fill="grey" className="w-6 h-6" />
        </Button>
        <NotifiFullLogo />
      </div>

      {hasLoaded ? (
        !connected ? (
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
              <InputRow
                label="phone"
                icon={
                  <ChatAltIcon className=" z-10 h-10 text-primary-light w-7 mr-1 mt-9 absolute left-3" />
                }
              >
                <Input
                  className="min-w-11/12 py-3 pl-[130px] px-4 appearance-none w-11/12 outline-0 focus:outline-none"
                  type="tel"
                  value={phone}
                  onChange={handlePhone}
                  placeholder="XXX-XXX-XXXX"
                />
                <div className="absolute h-10 inset-y-8 pr-10">
                  <Listbox
                    value={countryDialCode}
                    onChange={setCountryDialCode}
                  >
                    <div className="relative h-10 w-[120px]">
                      <Listbox.Button className="relative h-[45px] w-full cursor-default rounded-lg bg-none pl-12 pr-5 text-left shadow-md focus:outline-primary-light focus:ring-primary-light focus:ring-1 focus:text-primary-light sm:text-sm text-gray-400">
                        <span className="block truncate">
                          {countryDialCode}
                        </span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 z-10">
                          <ChevronDownIcon
                            className="h-5 w-5 text-gray-400 focus:color-primary-light focus:text-primary-light"
                            aria-hidden="true"
                          />
                        </span>
                      </Listbox.Button>
                      <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                      >
                        <Listbox.Options className="absolute z-20 max-h-60 w-[400px] overflow-auto rounded-md bg-bkg-3 text-gray-400 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                          {viewableCountries.map(
                            ({ dial_code, emoji, name }, idx) => (
                              <Listbox.Option
                                key={idx}
                                className={({ active }) =>
                                  `relative cursor-default select-none py-2 pl-2 pr-4 z-20 ${
                                    active
                                      ? 'bg-gray-800 text-grey-300'
                                      : 'text-gray-300'
                                  }`
                                }
                                value={dial_code}
                              >
                                {({ selected }) => (
                                  <>
                                    <span
                                      className={`block truncate ${
                                        selected ? 'font-medium' : 'font-normal'
                                      }`}
                                    >
                                      <div className="w-full grid grid-cols-3 gap-3">
                                        <div className="col-start-1">
                                          {emoji}
                                          <span className="pl-3">{name}</span>
                                        </div>
                                        <div className="col-start-5 ">
                                          {dial_code}
                                        </div>
                                      </div>
                                    </span>
                                  </>
                                )}
                              </Listbox.Option>
                            )
                          )}
                        </Listbox.Options>
                      </Transition>
                    </div>
                  </Listbox>
                </div>
              </InputRow>
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
