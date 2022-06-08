import Switch from '@components/Switch'
import { EndpointTypes } from '@models/types'
import {
  BlockchainEnvironment,
  useNotifiClient,
} from '@notifi-network/notifi-react-hooks'
import { useRouter } from 'next/router'
import React, {
  FunctionComponent,
  useCallback,
  useEffect,
  useState,
} from 'react'
import useWalletStore from 'stores/useWalletStore'
import NotifiFullLogo from './NotifiFullLogo'

interface NotifiPreviewCardProps {
  onClick: () => void
}

const NotifiPreviewCard: FunctionComponent<NotifiPreviewCardProps> = ({
  onClick,
}) => {
  const wallet = useWalletStore((s) => s.current)
  const router = useRouter()
  const [telegramEnabled, setTelegramEnabled] = useState<boolean>(false)
  const { cluster } = router.query

  let env = BlockchainEnvironment.MainNetBeta
  const endpoint = cluster ? (cluster as EndpointTypes) : 'mainnet'

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
  const { data, getConfiguration } = useNotifiClient({
    dappAddress: `solanarealmsdao`,
    walletPublicKey: wallet?.publicKey?.toString() ?? '',
    env,
  })

  const [email, setEmail] = useState<string>('')
  const [phone, setPhone] = useState<string>('')
  const [telegram, setTelegram] = useState<string>('')
  const [toggles, setToggles] = useState<any>([])

  const updateTelegramSupported = useCallback(async () => {
    const { supportedTargetTypes } = await getConfiguration()
    const telegram = supportedTargetTypes.find((it) => it === 'TELEGRAM')
    setTelegramEnabled(telegram !== undefined)
  }, [getConfiguration, setTelegramEnabled])

  useEffect(() => {
    updateTelegramSupported().catch((e) => {
      console.error('Failed to get supported type information: ', e)
    })
  }, [updateTelegramSupported])

  useEffect(() => {
    const targetGroup = firstOrNull(data?.targetGroups)
    setEmail(firstOrNull(targetGroup?.emailTargets)?.emailAddress ?? '')
    setPhone(firstOrNull(targetGroup?.smsTargets)?.phoneNumber ?? '')
    setTelegram(firstOrNull(targetGroup?.telegramTargets)?.telegramId ?? '')
  }, [data])

  // fetch the sources from somewhere
  const testDaos = [
    { name: 'Mango Dao', isToggled: true },
    { name: 'Realms DAO Global', isToggled: false },
    { name: 'Mango Dao', isToggled: true },
    { name: 'SERUM Notifications', isToggled: true },
    { name: 'Mango Dao', isToggled: true },
    { name: 'Mango Dao', isToggled: true },
    { name: 'Realms DAO Global', isToggled: false },
    { name: 'Mango Dao', isToggled: true },
    { name: 'SERUM Notifications', isToggled: true },
    { name: 'Mango Dao', isToggled: true },
    { name: 'Mango Dao', isToggled: true },
    { name: 'Realms DAO Global', isToggled: false },
    { name: 'Mango Dao', isToggled: true },
    { name: 'SERUM Notifications', isToggled: true },
    { name: 'Mango Dao', isToggled: true },
  ]

  const firstOrNull = <T,>(
    arr: ReadonlyArray<T> | null | undefined
  ): T | null => {
    if (arr !== null && arr !== undefined) {
      return arr[0] ?? null
    }
    return null
  }

  const handleEdit = () => {
    onClick()
  }

  const Line = () => (
    <div className="border-b-2 border-white-800 opacity-20 col-span-12 py-3" />
  )

  //TODO - Complete wiring for mango dao notifications
  const handleToggleSwitch = (index: number) => {
    handleNotifications(!notificationsOn)
    const modifyArray = [...toggles]
    modifyArray[index].isToggled = !modifyArray[index].isToggled
    setToggles(modifyArray)
  }

  const [notificationsOn, handleNotifications] = useState(false)

  useEffect(() => {
    setToggles(testDaos)
  }, [setToggles])

  const daoNotifications = (dao: any, index: number) => {
    return (
      <div
        key={index}
        className="items-center snap-center w-full col-span-12 pt-4 flex flex-row justify-between"
      >
        <div className="text-xs align-items-center">
          {dao.name} Notifications On
        </div>
        <Switch
          checked={dao.isToggled}
          onChange={() => handleToggleSwitch(index)}
        />
      </div>
    )
  }
  const notificationsToggle = toggles.map((dao: any, index: number) => {
    return daoNotifications(dao, index)
  })

  return (
    <div className="grid grid-cols-12 bg-bkg-1 px-10 py-3 text-sm w-full">
      <div className="col-span-12">
        <p className="py-0.5">{email}</p>
        <p className="py-0.5">{phone}</p>
        {telegramEnabled && <p className="py-0.5">{telegram}</p>}
        <a
          className="text-sm text-primary-dark cursor-pointer pb-2 font-medium"
          onClick={handleEdit}
        >
          Edit Information
        </a>
      </div>
      <Line />

      <div className="h-[200px] w-full snap-y col-span-12 overflow-scroll">
        {notificationsToggle}
      </div>
      <Line />
      <div className="col-span-12 flex flex-row pt-4 items-center">
        <p className="text-white text-[10px] font-light w-fit whitespace-nowrap flex-start">
          Powered by
        </p>
        <span>
          <NotifiFullLogo height="12" width="60" />
        </span>
      </div>
      <a
        className="col-end-13 text-xs text-primary-dark cursor-pointer col-span-3 relative -top-4"
        href="https://docs.notifi.network/"
      >
        Learn More
      </a>
    </div>
  )
}

export default NotifiPreviewCard
