import './App.css';
import { connect, disconnect, sign, encrypt, decrypt, getActiveKey, getActivePublicKey, getWalletNames, signature } from 'kms-js'
import Arweave from 'arweave'
import { Buffer } from "buffer";

const arweave = Arweave.init({})

function App() {

  const handleConnect = async () => {
    const res = await connect()
    console.log('Connect,\n', res)
  }

  const handleDisconnect = async () => {
    const res = await disconnect()
    console.log('Disconnect,\n', res)
  }

  const handleSign = async () => {
    const transaction = await arweave.createTransaction({
        data: Buffer.from('Some data', 'utf8')
    });
    const res = await sign(transaction)
    console.log('Sign,\n', res)
  }

  const handleEncrypt = async () => {
    const data = Buffer.from('Encrypt this data please.')
    const res = await encrypt(data)
    console.log('Encrypt,\n', res)
  }

  const handleDecrypt = async () => {
    const data = Buffer.from('Decrypt this data please.')
    const encryptedData = await encrypt(data)
    console.log(encryptedData)
    const res = await decrypt(encryptedData.data)
    console.log('Decrypt,\n', res)
  }

  const handleGetActiveKey = async () => {
    const res = await getActiveKey()
    console.log('Get Active Key,\n', res)
  }

  const handleGetActivePublicKey = async () => {
    const res = await getActivePublicKey()
    console.log('Get Active Public Key,\n', res)
  }

  const handleGetWalletNames = async () => {
    const res = await getWalletNames()
    console.log('Get Wallet Names,\n', res)
  }

  const handleSignature = async () => {
    const res = await signature('Sign this')
    console.log('Signature,\n', res)
  }

  return (
    <div className="App">
      <div className='column'>
        <h1>KMS-JS SDK</h1>
        <button onClick={handleConnect}>connect</button>
        <button onClick={handleDisconnect}>disconnect</button>
        <button onClick={handleSign}>sign</button>
        <button onClick={handleEncrypt}>encrypt</button>
        <button onClick={handleDecrypt}>decrypt</button>
        <button onClick={handleGetActiveKey}>getActiveKey</button>
        <button onClick={handleGetActivePublicKey}>getActivePublicKey</button>
        <button onClick={handleGetWalletNames}>getWalletNames</button>
        <button onClick={handleSignature}>signature</button>
      </div>
    </div>
  );
}

export default App;
