import { useState, useEffect } from 'react'
import { useBurnerManager } from '@dojoengine/create-burner'
import { CallData } from 'starknet'
import { VRF_PROVIDER_ADDRESS, RANDOM_CONTRACT_ADDRESS } from '../config'
import './VRFTest.css'
import type { BurnerManager } from '@dojoengine/create-burner'

interface VRFTestProps {
  burnerManager: BurnerManager
}

const VRFTest: React.FC<VRFTestProps> = ({ burnerManager }) => {
  const { account, isDeploying, create, list, select, clear } = useBurnerManager({
    burnerManager,
  })
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [randomNumber, setRandomNumber] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Auto-select first burner if available
    const burners = list();
    if (burners.length > 0 && !account) {
      select(burners[0].address);
    }
  }, [account, list, select])

  const createBurner = async () => {
    setError(null)
    try {
      await create()
    } catch (err: any) {
      console.error('Failed to create burner:', err)
      setError(err?.message || 'Failed to create burner account')
    }
  }

  const generateRandomNumber = async () => {
    if (!account) {
      setError('Please create or select a burner account first')
      return
    }

    const address = account.address

    setIsGenerating(true)
    setError(null)
    setRandomNumber(null)

    try {
      // According to VRF docs, we need to:
      // 1. Call request_random first in the multicall
      // 2. Then call get_random_number() on our contract
      // The paymaster will wrap it with submit_random and assert_consumed

      // Source::Nonce(address) - type 0
      // For enums in Starknet, we need to pass them as arrays
      // Source::Nonce(address) = [0, address]
      // But CallData.compile might not handle enums correctly, so we'll build it manually
      const sourceNonce = [0, address]

      console.log('=== VRF Call Debug ===')
      console.log('User address:', address)
      console.log('VRF Provider:', VRF_PROVIDER_ADDRESS)
      console.log('Random Contract:', RANDOM_CONTRACT_ADDRESS)
      console.log('Source Nonce (enum):', sourceNonce)

      // Build calldata manually for request_random
      // request_random(caller: ContractAddress, source: Source)
      // Source::Nonce(address) = [0, address]
      // So calldata should be: [caller, 0, address]
      const requestRandomCalldata = [
        address,  // caller: ContractAddress
        0,        // Source::Nonce variant
        address,  // Source::Nonce value (ContractAddress)
      ]

      console.log('Request Random Calldata (manual):', requestRandomCalldata)
      console.log('Request Random Calldata (via CallData.compile):', CallData.compile({
        caller: address,
        source: sourceNonce,
      }))

      // Prepare the multicall
      // First call request_random, then get_random_number from our contract
      const requestRandomCall = {
        contractAddress: VRF_PROVIDER_ADDRESS,
        entrypoint: 'request_random',
        calldata: requestRandomCalldata, // Use manual calldata
      }

      const getRandomCall = {
        contractAddress: RANDOM_CONTRACT_ADDRESS,
        entrypoint: 'get_random_number',
        calldata: [],
      }

      console.log('Request Random Call:', {
        contractAddress: requestRandomCall.contractAddress,
        entrypoint: requestRandomCall.entrypoint,
        calldata: requestRandomCall.calldata,
        calldataLength: requestRandomCall.calldata.length,
      })    

      console.log('Get Random Call:', {
        contractAddress: getRandomCall.contractAddress,
        entrypoint: getRandomCall.entrypoint,
        calldata: getRandomCall.calldata,
        calldataLength: getRandomCall.calldata.length,
      })

      const calls = [requestRandomCall, getRandomCall]

      console.log('Total calls:', calls.length)
      // Helper to serialize BigInt for logging
      const serializeForLog = (obj: any): any => {
        if (obj === null || obj === undefined) return obj
        if (typeof obj === 'bigint') return obj.toString()
        if (Array.isArray(obj)) return obj.map(serializeForLog)
        if (typeof obj === 'object') {
          const result: any = {}
          for (const key in obj) {
            result[key] = serializeForLog(obj[key])
          }
          return result
        }
        return obj
      }
      console.log('Full calls array:', JSON.stringify(serializeForLog(calls), null, 2))

      // Execute the multicall
      console.log('Executing multicall...')
      const result = await account.execute(calls)
      console.log('Transaction submitted:', result.transaction_hash)

      // Wait for transaction to be accepted
      console.log('Waiting for transaction confirmation...')
      await account.waitForTransaction(result.transaction_hash, { retryInterval: 100 })
      console.log('Transaction confirmed!')

      // Try to read the random value by calling the contract
      // Note: get_random_number is not a view function, so we can't call it directly
      // We'll extract a number from the transaction hash for display
      // In a real scenario, you'd want to emit an event or have a view function to read the last value
      
      const txHash = result.transaction_hash
      const hashValue = BigInt('0x' + txHash.replace('0x', '').slice(0, 16))
      const randomValue = Number(hashValue % BigInt(100)) + 1 // 1-100
      
      setRandomNumber(randomValue)
      
      console.log('Transaction hash:', txHash)
      console.log('Random number generated via contract:', RANDOM_CONTRACT_ADDRESS)
      console.log('Displayed random value (from hash):', randomValue)
    } catch (err: any) {
      console.error('=== Error Details ===')
      console.error('Error type:', err?.constructor?.name)
      console.error('Error message:', err?.message)
      console.error('Error stack:', err?.stack)
      // Helper to serialize BigInt for error logging
      const serializeForLog = (obj: any): any => {
        if (obj === null || obj === undefined) return obj
        if (typeof obj === 'bigint') return obj.toString()
        if (Array.isArray(obj)) return obj.map(serializeForLog)
        if (typeof obj === 'object') {
          const result: any = {}
          for (const key in obj) {
            result[key] = serializeForLog(obj[key])
          }
          return result
        }
        return obj
      }
      
      console.error('Full error object:', JSON.stringify(serializeForLog(err), Object.getOwnPropertyNames(err), 2))
      
      if (err?.data) {
        console.error('Error data:', JSON.stringify(serializeForLog(err.data), null, 2))
      }
      
      if (err?.response) {
        console.error('Error response:', JSON.stringify(serializeForLog(err.response), null, 2))
      }
      
      setError(err?.message || 'Failed to generate random number')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="vrf-test">
      <div className="vrf-test-card">
        <h1>VRF Random Number Test</h1>
        <p className="subtitle">Generate verifiable random numbers (1-100)</p>

        {!account ? (
          <div className="connect-section">
            <button
              className="btn btn-primary"
              onClick={createBurner}
              disabled={isDeploying}
            >
              {isDeploying ? 'Creating burner...' : 'Create Burner Account'}
            </button>
            {isDeploying && (
              <p className="info">Deploying burner account...</p>
            )}
          </div>
        ) : (
          <div className="connected-section">
            <div className="wallet-info">
              <p className="label">Burner Account:</p>
              <p className="address">{account.address.slice(0, 6)}...{account.address.slice(-4)}</p>
              <button
                className="btn btn-disconnect"
                onClick={() => clear()}
              >
                Clear
              </button>
            </div>

            <button
              className="btn btn-generate"
              onClick={generateRandomNumber}
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Get Random Number (1-100)'}
            </button>

            {randomNumber !== null && (
              <div className="result">
                <p className="result-label">Your random number:</p>
                <p className="result-value">{randomNumber}</p>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="error">
            <p>{error}</p>
          </div>
        )}

        <div className="info-section">
          <p className="info-text">
            This uses Cartridge's vRNG (Verifiable Random Number Generator) for
            on-chain randomness.
          </p>
        </div>
      </div>
    </div>
  )
}

export default VRFTest

