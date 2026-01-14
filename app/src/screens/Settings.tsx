import {
  IonContent,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonToggle,
} from '@ionic/react'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { useEffect, useState } from 'react'
import AppHeader from '../components/AppHeader'
import {
  exportLogsAsText,
  getLogOptIn,
  setLogOptIn,
  wipeLogs,
} from '../services/logStore'
import { disconnectGmail } from '../services/googleAuth'
import { wipeAllLocalData } from '../services/secureStore'

export default function Settings() {
  const [logOptIn, setOptIn] = useState(false)

  useEffect(() => {
    getLogOptIn().then(setOptIn)
  }, [])

  async function handleToggleLogs(enabled: boolean) {
    await setLogOptIn(enabled)
    setOptIn(enabled)
  }

  async function handleExportLogs() {
    const text = await exportLogsAsText()
    if (!text) {
      alert('No logs to export.')
      return
    }

    await navigator.clipboard.writeText(text)
    alert('Diagnostics copied to clipboard. Paste into a plain text file to share.')
  }

  async function handleDownloadLogs() {
    const text = await exportLogsAsText()
    if (!text) {
      alert('No logs to export.')
      return
    }

    const filename = `scrappy-kin-diagnostics-${new Date().toISOString()}.txt`
    const result = await Filesystem.writeFile({
      path: filename,
      data: text,
      directory: Directory.Cache,
      encoding: 'utf8',
    })

    await Share.share({
      title: 'Scrappy Kin diagnostics',
      text: 'Plain text diagnostics export.',
      url: result.uri,
      dialogTitle: 'Share diagnostics',
    })
  }

  async function handleWipeLogs() {
    await wipeLogs()
    alert('Logs wiped locally.')
  }

  async function handleDisconnect() {
    await disconnectGmail()
    alert('Gmail disconnected.')
  }

  async function handleWipeAll() {
    const confirmed = confirm('Delete all local data? This cannot be undone.')
    if (!confirmed) return
    await wipeAllLocalData()
    alert('All local data deleted.')
  }

  return (
    <IonPage>
      <AppHeader title="Settings" />
      <IonContent className="page-content">
        <IonList>
          <IonItem>
            <IonLabel>
              <h2>Diagnostics</h2>
              <p>
                Diagnostics are short, local logs that help us troubleshoot bugs. They never
                include your personal info and never leave your device automatically.
              </p>
              <p>
                If you choose to export them, you can review the plain-text file and email it to
                support@scrappykin.com.
              </p>
            </IonLabel>
            <IonToggle
              checked={logOptIn}
              onIonChange={(event) => handleToggleLogs(event.detail.checked)}
            />
          </IonItem>
          <IonItem button onClick={handleExportLogs}>
            <IonLabel>Export diagnostics (plain text)</IonLabel>
          </IonItem>
          <IonItem button onClick={handleDownloadLogs}>
            <IonLabel>Download diagnostics file</IonLabel>
          </IonItem>
          <IonItem button onClick={handleWipeLogs}>
            <IonLabel>Wipe diagnostics</IonLabel>
          </IonItem>
          <IonItem lines="none">
            <IonNote>
              Diagnostics never send automatically. Copy or download and email manually if needed.
            </IonNote>
          </IonItem>
        </IonList>

        <IonList>
          <IonItem button onClick={handleDisconnect}>
            <IonLabel>Disconnect Gmail</IonLabel>
          </IonItem>
          <IonItem button onClick={handleWipeAll}>
            <IonLabel>Delete all local data</IonLabel>
          </IonItem>
        </IonList>
      </IonContent>
    </IonPage>
  )
}
