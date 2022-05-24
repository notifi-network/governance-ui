import Switch from '@components/Switch'
import React, { FunctionComponent, useState } from 'react'
import NotifiFullLogo from './NotifiFullLogo'

interface NotifiPreviewCardProps {
  onClick: () => void
  email: string
  phone: string
  telegram?: string
  notificationsOn?: boolean
}

const NotifiPreviewCard: FunctionComponent<NotifiPreviewCardProps> = ({
  onClick,
  email,
  phone,
  telegram,
}) => {
  const handleEdit = () => {
    onClick()
  }

  const Line = () => (
    <div className="border-b-2 border-white-800 opacity-20 col-span-12 py-3" />
  )

  //TODO - Complete wiring for mango dao notifications
  const handleToggleSwitch = () => {
    handleNotifications(!notificationsOn)
  }
  const [notificationsOn, handleNotifications] = useState(false)

  return (
    <div className="grid grid-cols-12 bg-bkg-1 px-10 py-3 text-sm w-full">
      <div className="col-span-12">
        <p className="py-0.5">{email}</p>
        <p className="py-0.5">{phone}</p>
        <p className="py-0.5">{telegram}</p>
        <a
          className="text-sm text-primary-dark cursor-pointer pb-2 font-medium"
          onClick={handleEdit}
        >
          Edit Information
        </a>
      </div>
      <Line />

      <div className="items-center w-full col-span-12 pt-6 flex flex-row justify-between">
        <div className="text-xs align-items-center">
          Mango DAO Notifications On
        </div>
        <Switch checked={notificationsOn} onChange={handleToggleSwitch} />
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
