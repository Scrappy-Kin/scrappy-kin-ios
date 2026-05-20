import { IonContent, IonPage } from '@ionic/react'
import { crop, folderOpenOutline } from 'ionicons/icons'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AppCard from '../primitives/AppCard'
import AppIcon from '../primitives/AppIcon'
import AppText from '../primitives/AppText'
import './harness.css'

type CaptureEntry = {
  id: string
  title: string
  description: string
  group: string
  route: string
  imagePath: string
  summary?: string
}

type CaptureManifest = {
  generatedAt: string
  baseUrl: string
  outputDir: string
  captures: CaptureEntry[]
}

const MANIFEST_URL = '/review-artifacts/manifest.json'
const sizeOptions = ['100%', '50%', '25%', '10%'] as const
type GallerySize = (typeof sizeOptions)[number]

export default function ScreenshotGallery() {
  const [manifest, setManifest] = useState<CaptureManifest | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [revealError, setRevealError] = useState<string | null>(null)
  const [selectedGroup, setSelectedGroup] = useState('all')
  const [selectedSize, setSelectedSize] = useState<GallerySize>('25%')
  const [cropTallScreens, setCropTallScreens] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadManifest() {
      setError(null)

      try {
        const response = await fetch(`${MANIFEST_URL}?ts=${Date.now()}`)
        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? 'No screenshots yet. Run the capture script first.'
              : `Could not load screenshot manifest (${response.status}).`,
          )
        }

        const contentType = response.headers.get('content-type') ?? ''
        if (!contentType.includes('application/json')) {
          throw new Error(
            'Screenshot manifest is missing from the active server output. Re-run the capture script, then reload.',
          )
        }

        const nextManifest = (await response.json()) as CaptureManifest
        if (!cancelled) {
          setManifest(nextManifest)
        }
      } catch (cause) {
        if (!cancelled) {
          setManifest(null)
          setError((cause as Error).message)
        }
      }
    }

    void loadManifest()

    return () => {
      cancelled = true
    }
  }, [])

  const groups = useMemo(() => {
    const entries = manifest?.captures ?? []
    return ['all', ...Array.from(new Set(entries.map((entry) => entry.group)))]
  }, [manifest])

  const filteredCaptures = useMemo(() => {
    const entries = manifest?.captures ?? []
    if (selectedGroup === 'all') {
      return entries
    }
    return entries.filter((entry) => entry.group === selectedGroup)
  }, [manifest, selectedGroup])

  const generatedLabel = useMemo(() => {
    if (!manifest) {
      return null
    }

    return new Intl.DateTimeFormat('en-CA', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(manifest.generatedAt))
  }, [manifest])

  const galleryGridClassName = `screenshot-gallery-grid screenshot-gallery-grid--${selectedSize.replace('%', '')}`
  const screenshotCardClassName = `screenshot-gallery-card screenshot-gallery-card--link${cropTallScreens ? ' screenshot-gallery-card--cropped' : ''}`
  const captureVersion = encodeURIComponent(manifest?.generatedAt ?? 'current')

  const revealCaptureFolder = async () => {
    if (!manifest?.outputDir) {
      return
    }

    setRevealError(null)

    try {
      const response = await fetch(`/__local/reveal?path=${encodeURIComponent(manifest.outputDir)}`)
      if (!response.ok) {
        throw new Error('Could not open the capture folder.')
      }
    } catch (cause) {
      setRevealError((cause as Error).message)
    }
  }

  return (
    <IonPage>
      <IonContent className="app-content screenshot-gallery-content">
        <div className="app-shell screenshot-gallery-shell">
          <div className="screenshot-gallery-toolbar">
            <div className="screenshot-gallery-segmented-control" role="tablist" aria-label="Category filter">
              {groups.map((group) => (
                <button
                  key={group}
                  type="button"
                  className={`screenshot-gallery-segmented-control__button${selectedGroup === group ? ' screenshot-gallery-segmented-control__button--active' : ''}`}
                  onClick={() => setSelectedGroup(group)}
                  aria-pressed={selectedGroup === group}
                >
                  {group}
                </button>
              ))}
            </div>
            {manifest ? (
              <>
                <div className="screenshot-gallery-segmented-control" role="tablist" aria-label="Screenshot size">
                  {sizeOptions.map((size) => (
                    <button
                      key={size}
                      type="button"
                      className={`screenshot-gallery-segmented-control__button${selectedSize === size ? ' screenshot-gallery-segmented-control__button--active' : ''}`}
                      onClick={() => setSelectedSize(size)}
                      aria-pressed={selectedSize === size}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                <div className="screenshot-gallery-segmented-control" role="group" aria-label="Gallery view options">
                  <button
                    type="button"
                    className={`screenshot-gallery-segmented-control__button screenshot-gallery-segmented-control__button--icon${cropTallScreens ? ' screenshot-gallery-segmented-control__button--active' : ''}`}
                    onClick={() => setCropTallScreens((current) => !current)}
                    aria-pressed={cropTallScreens}
                    aria-label={cropTallScreens ? 'Show full image height' : 'Clip tall screenshots'}
                    title={cropTallScreens ? 'Show full image height' : 'Clip tall screenshots'}
                  >
                    <AppIcon icon={crop} size="sm" />
                  </button>
                </div>
                <button
                  type="button"
                  className="screenshot-gallery-toolbar__icon-action"
                  onClick={() => void revealCaptureFolder()}
                  aria-label="Open capture folder"
                  title="Open capture folder"
                >
                  <AppIcon icon={folderOpenOutline} size="sm" />
                </button>
              </>
            ) : null}
            {generatedLabel ? (
              <AppText intent="caption" className="screenshot-gallery-generated">
                {generatedLabel}
              </AppText>
            ) : null}
          </div>

          {error ? (
            <AppCard title="No captured screenshots yet">
              <div className="app-stack">
                <AppText intent="body">
                  Captured screenshot thumbnails appear here after a manual capture run. Use the
                  review board for agent QA.
                </AppText>
                <AppText intent="supporting">
                  Run `npm run capture:screens:manual -- --group onboarding` or another subset from
                  an unsandboxed runner, then reload.
                </AppText>
                <Link className="app-link" to="/ui-harness/review-board">
                  Open review board
                </Link>
              </div>
            </AppCard>
          ) : null}

          {revealError ? (
            <AppCard title="Folder unavailable">
              <AppText intent="body">{revealError}</AppText>
            </AppCard>
          ) : null}

          {filteredCaptures.length ? (
            <section className={galleryGridClassName}>
              {filteredCaptures.map((entry) => (
                <Link
                  key={entry.id}
                  className={screenshotCardClassName}
                  to={`/ui-harness/review-board?state=${encodeURIComponent(entry.id)}`}
                  aria-label={`Open in review board: ${entry.title}`}
                  title={entry.title}
                >
                  <img
                    className="screenshot-gallery-card__image"
                    src={`${entry.imagePath}?v=${captureVersion}`}
                    alt={entry.title}
                    loading="lazy"
                  />
                </Link>
              ))}
            </section>
          ) : null}

        </div>
      </IonContent>
    </IonPage>
  )
}
