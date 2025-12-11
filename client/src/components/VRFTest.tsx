import { useState, useEffect } from 'react'
import { useBurnerManager } from '@dojoengine/create-burner'
import { CallData, Contract, RpcProvider, shortString } from 'starknet'
import { VRF_PROVIDER_ADDRESS, RANDOM_CONTRACT_ADDRESS, RPC_URL } from '../config'
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

    setIsGenerating(true)
    setError(null)
    setRandomNumber(null)

    try {
      const { transaction_hash } = await account.execute([
        {
        contractAddress: VRF_PROVIDER_ADDRESS,
        entrypoint: "request_random",
        calldata: [RANDOM_CONTRACT_ADDRESS, '0', account.address]
      },
      { 
        contractAddress: RANDOM_CONTRACT_ADDRESS,
        entrypoint: "set_random",
        calldata: [],
      }]
    );
      console.log('Transaction submitted:', transaction_hash)

      // Wait for transaction to be accepted
      console.log('Waiting for transaction confirmation...')
      await account.waitForTransaction(transaction_hash, { retryInterval: 100 })
      console.log('Transaction confirmed!')

      // Call get_random to get the actual value that was set
      console.log('Calling get_random to retrieve the actual value...')

      await new Promise(resolve => setTimeout(resolve, 2000))
      const randomValueBigInt = await account.callContract({
        contractAddress: RANDOM_CONTRACT_ADDRESS,
        entrypoint: "get_random",
        calldata: [],
      })
      // setRandomNumber(randomValueBigInt)
      
      console.log('Transaction hash:', transaction_hash)
      console.log('get_random() call:', randomValueBigInt)
      // console.log('Displayed VRF number:', randomValueBigInt)
    } catch (err: any) {
      console.error('=== Error Details ===')
      console.error('Error type:', err?.constructor?.name)
      console.error('Error message:', err?.message)
      console.error('Error stack:', err?.stack)
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
              {isGenerating ? 'Generating...' : 'Generate VRF number'}
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

