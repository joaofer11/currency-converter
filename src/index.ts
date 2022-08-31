import 'css/index.css'


// VARIABLES
const currencyOneEl = document.querySelector('[data-js="currency-one"]')! as HTMLSelectElement
const currencyTwoEl = document.querySelector('[data-js="currency-two"]')! as HTMLSelectElement
const currenciesEl = document.querySelector('[data-js="currencies-container"]')!
const convertedValueEl = document.querySelector('[data-js="converted-value"]')!
const valuePrecisionEl = document.querySelector('[data-js="conversion-precision"]')!
const currencyOneTimesEl = document.querySelector('[data-js="currency-one-times"]')!


// TYPES & INTERFACES
interface IExchangeRate {
   result: string,
   'base-code': boolean,
   conversion_rates: Record<string, string>
}

type IGenericObj = Record<string, any>

// FUNCTION GRAPH
const createElement = (name: string) =>
   (attributes: IGenericObj = {}, ...classNames: string[]) => {
      const element = document.createElement(name)
      const attributesAsArray: Array<string[]> = Object.entries(attributes)
      
      element.classList.add(...classNames)
      attributesAsArray.forEach(([att, value]) => element.setAttribute(att, value))
      return element
}

const insertErrorMessageIntoDom = (errMessage: any) => {
    const div = createElement('div')(
        { 
            role: 'alert'
        }, 
        'alert', 'alert-warning', 'alert-dismissible', 'fade', 'show'
        )
    const button = createElement('button')(
        {
            type: 'button',
            'aria-label': 'Close'
        }, 
        'btn-close'
        )
    
    div.textContent = errMessage
    div.appendChild(button)
    currenciesEl.insertAdjacentElement('afterend', div)
    button.addEventListener('click', () => div.remove())
}

const exchangeRateState = (() => {
   let state = {} as IExchangeRate

   return {
      getState: () => state,
      setState: (newState: IExchangeRate) => {
         if (!(newState.conversion_rates)) {
               insertErrorMessageIntoDom('O objeto deve conter a propriedade "conversion_rates"')
               return
         }
         state = newState
      }
   }
})()

const showErrorMessage = (errorType: string) => ({
   'unsupported-code': 'O tipo da moeda não existe em nosso banco de dados.',
   'malformed-request': 'O endpoint do seu request deve seguir a seguinte estrutura: https://v6.exchangerate-api.com/v6/163f74e415d3a61af2063975/latest/USD',
   'invalid-key': 'Chave de API invalida.',
   'inactive-account': 'Seu endereço de email não foi confirmado.',
   'quota-reached': 'Sua conta atingiu o limite de solicitações.'
})[errorType] || 'Não foi possivel obter as informações.'

const requestExchangeRateData = async (currency: string) => {
   const url = `https://v6.exchangerate-api.com/v6/163f74e415d3a61af2063975/latest/${currency}`
   
   try {
      const response = await fetch(url)
        
      if (!response.ok) {
         throw new Error('Sua conexão falhou. Não foi possível obter as informações.')
      }
        
      const exchangeRateData = await response.json()
        
      if (exchangeRateData.result === 'error') {
         throw new Error(showErrorMessage(exchangeRateData['error-type']))
      }
        
      exchangeRateState.setState(exchangeRateData)

   } catch({ message }: any) {
         insertErrorMessageIntoDom(message)
      }
}

const getSelectedCurrency = (currencyOption: HTMLSelectElement) => {
   const currenciesAsArray = [...currencyOption!.children] as HTMLOptionElement[]
   const selectedCurrency = currenciesAsArray.reduce((acc, currency) => {
      if (currency!.selected) {
         return currency.value
      }
      return acc
   }, '')
   
   return selectedCurrency
}

const getMultiplier = () => {
   const selectedCurrency = getSelectedCurrency(currencyTwoEl)
   return Number(exchangeRateState.getState()!.conversion_rates![selectedCurrency as string])
}

const updateConvertedValue = (e: any) => {
   const multiplying = e.target.value
   const multiplier = getMultiplier().toFixed(2)
   
   if (multiplying !== '') {
      convertedValueEl!.textContent = String(+multiplying * +multiplier)
   }
}

const convertCurrency = (fixed: boolean) => {
   const { conversion_rates } = exchangeRateState.getState()
   const selectedCurrency = getSelectedCurrency(currencyTwoEl)
   
   return (fixed)
      ? Number(conversion_rates[selectedCurrency]).toFixed(2)
      : conversion_rates[selectedCurrency]
   
}

const updateValueOfSelectedCurrencyOne = async () => {
   await requestExchangeRateData(getSelectedCurrency(currencyOneEl))
   convertedValueEl!.textContent = convertCurrency(true)
   valuePrecisionEl!.textContent = `1 ${getSelectedCurrency(currencyOneEl)} = ${convertCurrency(false)} ${getSelectedCurrency(currencyTwoEl)}`
}


const updateValueOfSelectedCurrencyTwo = () => {
   convertedValueEl!.textContent = convertCurrency(true)
   valuePrecisionEl!.textContent = `1 ${getSelectedCurrency(currencyOneEl)} = ${convertCurrency(false)} ${getSelectedCurrency(currencyTwoEl)}`
}

const getOptions = (conversionRates: Record<string, string>) => 
   (selectedCurrency: string) => {
    
      return Object
         .keys(conversionRates)
         .map(currency => 
            `<option ${currency === selectedCurrency ? 'selected' : ''}>${currency}</option>`)
         .join('')
   }

const init = async () => {
   await requestExchangeRateData('USD')
   const { conversion_rates }: IExchangeRate = exchangeRateState.getState()
   
   
   currencyOneEl.innerHTML = getOptions(conversion_rates!)('USD')
   currencyTwoEl.innerHTML = getOptions(conversion_rates!)('BRL')
   convertedValueEl.textContent = convertCurrency(true)
   valuePrecisionEl.textContent = `1 USD = ${convertCurrency(false)} BRL`
}


// EVENT LISTENERS
currencyOneTimesEl.addEventListener('input', updateConvertedValue)
currencyOneEl.addEventListener('input', updateValueOfSelectedCurrencyOne)
currencyTwoEl.addEventListener('input', updateValueOfSelectedCurrencyTwo)


// FUNCTION CALL
init()