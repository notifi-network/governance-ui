import Input from '@components/inputs/Input'
import { Listbox, Transition } from '@headlessui/react'
import { ChatAltIcon, ChevronDownIcon } from '@heroicons/react/outline'
import { Fragment, useCallback, useEffect, useState } from 'react'
import { InputRow } from '.'
import { countryMap } from './data'
import { splitPhoneNumber } from './phoneUtils'

type Props = {
  handlePhone: any
  phoneNumber: string
}

const PhoneInput = ({ handlePhone, phoneNumber }: Props) => {
  const [selectedCountryCode, setCountryCode] = useState('US')
  const [dialCode, setDialCode] = useState('+1')
  const [baseNumber, setBaseNumber] = useState('')

  const selectCountryHandler = useCallback(
    (value: string) => {
      setCountryCode(value)
      const dialCode = countryMap[value].dialCode
      setDialCode(dialCode)

      const input = baseNumber !== '' ? dialCode + baseNumber : ''
      handlePhone(input)
    },
    [baseNumber, handlePhone]
  )

  useEffect(() => {
    if (phoneNumber) {
      splitphoneNumbers(phoneNumber)
    }
  }, [phoneNumber])

  const onChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      const onlyNumberInput = event.target.value.replace(/[^\d]/g, '')

      setBaseNumber(onlyNumberInput)
      const input = onlyNumberInput !== '' ? dialCode + onlyNumberInput : ''
      handlePhone(input)
    },
    [dialCode, handlePhone]
  )

  const splitphoneNumbers = (phoneNumber: string) => {
    if (!phoneNumber) {
      return
    }
    const { baseNumber, countryCode } = splitPhoneNumber(phoneNumber)
    if (!countryCode || !baseNumber) {
      throw new Error('Improper phone')
    }
    setBaseNumber(baseNumber)
    setCountryCode(countryCode)
  }

  return (
    <InputRow
      label="phone"
      icon={
        <ChatAltIcon className=" z-10 h-10 text-primary-light w-7 mr-1 mt-9 absolute left-3" />
      }
    >
      <Input
        className="min-w-11/12 py-3 pl-[130px] px-4 appearance-none w-11/12 outline-0 focus:outline-none"
        type="tel"
        value={baseNumber}
        onChange={onChange}
        placeholder="XXX-XXX-XXXX"
      />
      <div className="absolute h-10 inset-y-8 pr-10">
        <Listbox value={selectedCountryCode} onChange={selectCountryHandler}>
          <div className="relative h-10 w-[120px]">
            <Listbox.Button className="relative h-[45px] w-full cursor-default rounded-lg bg-none pl-12 pr-5 text-left shadow-md focus:outline-primary-light focus:ring-primary-light focus:ring-1 focus:text-primary-light sm:text-sm text-gray-400">
              <span className="block truncate">{dialCode}</span>
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
                {Object.entries(countryMap).map(
                  ([countryCode, countryMetadata], idx) => {
                    const { dialCode, flag, name } = countryMetadata
                    return (
                      <Listbox.Option
                        key={idx}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-2 pr-4 z-20 ${
                            active
                              ? 'bg-gray-800 text-grey-300'
                              : 'text-gray-300'
                          }`
                        }
                        value={countryCode}
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
                                  {flag}
                                  <span className="pl-3">{name}</span>
                                </div>
                                <div className="col-start-5 ">{dialCode}</div>
                              </div>
                            </span>
                          </>
                        )}
                      </Listbox.Option>
                    )
                  }
                )}
              </Listbox.Options>
            </Transition>
          </div>
        </Listbox>
      </div>
    </InputRow>
  )
}

export default PhoneInput
