import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { MapPin, ArrowRight } from "lucide-react"
import api from "../lib/api"
import { useAuth } from "../context/AuthContext"
import { useRunnerProfile } from "../context/RunnerProfileContext"
import TopBar from "../components/TopBar"

const ID_TYPES = [
  { value: "national_id", label: "National ID" },
  { value: "drivers_license", label: "Driver's license" },
  { value: "voters_card", label: "Voter's card" },
  { value: "passport", label: "International passport" },
  { value: "nin_slip", label: "NIN slip" },
]

export default function ApplyAsRunner() {
  const { user } = useAuth()
  const { refresh } = useRunnerProfile()
  const navigate = useNavigate()

  const [skills, setSkills] = useState("")
  const [street, setStreet] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [idType, setIdType] = useState("national_id")
  const [idNumber, setIdNumber] = useState("")
  const [idPhotoFile, setIdPhotoFile] = useState(null)
  const [selfieFile, setSelfieFile] = useState(null)
  const [location, setLocation] = useState(null)
  const [locating, setLocating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const captureLocation = () => {
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocating(false)
      },
      () => {
        setError("Couldn't get your location. Check your browser's location permission.")
        setLocating(false)
      }
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!location) {
      setError("Share your location first — it's how errands get matched to you.")
      return
    }

    setSubmitting(true)
    try {
      await api.post("/runners", {
        user_id: user._id,
        skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
        location,
        address: { street, city, state, country: "Nigeria" },
        documents: { id_type: idType, id_number: idNumber },
      })

      // Upload photos after the profile exists — the endpoint resolves
      // the runner via the logged-in user, so order doesn't matter for
      // correctness, but doing it after means a photo upload failure
      // doesn't block the application itself from going in.
      const uploads = []
      if (idPhotoFile) {
        const form = new FormData()
        form.append("image", idPhotoFile)
        form.append("type", "id_image")
        uploads.push(api.post("/runners/documents", form))
      }
      if (selfieFile) {
        const form = new FormData()
        form.append("image", selfieFile)
        form.append("type", "selfie")
        uploads.push(api.post("/runners/documents", form))
      }
      if (uploads.length) {
        await Promise.allSettled(uploads) // best-effort — admin can still review without photos if one fails
      }

      await refresh()
      navigate("/pending", { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't submit your application. Try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-base">
      <TopBar title="Apply as a runner" />
      <div className="mx-auto max-w-md px-5 py-6">
        <p className="mb-5 text-sm text-muted">
          Tell us a bit about yourself. An admin reviews every application
          before you can go online and start receiving errands.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-hairline bg-panel p-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
              Skills (comma-separated)
            </label>
            <input
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="grocery runs, bank queues, motorbike"
              className="w-full rounded-lg border border-hairline bg-panel-raised px-3.5 py-2.5 text-sm text-ink placeholder:text-faint focus:border-amber focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">Street</label>
              <input
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="w-full rounded-lg border border-hairline bg-panel-raised px-3.5 py-2.5 text-sm text-ink focus:border-amber focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">City</label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-lg border border-hairline bg-panel-raised px-3.5 py-2.5 text-sm text-ink focus:border-amber focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">State</label>
              <input
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="FCT"
                className="w-full rounded-lg border border-hairline bg-panel-raised px-3.5 py-2.5 text-sm text-ink focus:border-amber focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">ID type</label>
            <select
              value={idType}
              onChange={(e) => setIdType(e.target.value)}
              className="w-full rounded-lg border border-hairline bg-panel-raised px-3.5 py-2.5 text-sm text-ink focus:border-amber focus:outline-none"
            >
              {ID_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">ID number</label>
            <input
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              className="w-full rounded-lg border border-hairline bg-panel-raised px-3.5 py-2.5 text-sm text-ink focus:border-amber focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
              ID photo
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setIdPhotoFile(e.target.files?.[0] || null)}
              className="w-full rounded-lg border border-hairline bg-panel-raised px-3.5 py-2.5 text-sm text-ink file:mr-3 file:rounded-md file:border-0 file:bg-amber-dim file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-ink"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
              Selfie
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setSelfieFile(e.target.files?.[0] || null)}
              className="w-full rounded-lg border border-hairline bg-panel-raised px-3.5 py-2.5 text-sm text-ink file:mr-3 file:rounded-md file:border-0 file:bg-amber-dim file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-ink"
            />
          </div>

          <button
            type="button"
            onClick={captureLocation}
            disabled={locating}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-hairline py-2.5 text-sm font-medium text-muted transition-colors hover:border-amber hover:text-amber disabled:opacity-50"
          >
            <MapPin size={15} />
            {location ? "Location captured ✓" : locating ? "Getting location…" : "Share my location"}
          </button>

          {error && (
            <div className="rounded-lg border border-bad/30 bg-bad-dim px-3 py-2 text-xs text-bad">{error}</div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber py-3 text-sm font-semibold text-[#1a1206] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit application"}
            {!submitting && <ArrowRight size={15} />}
          </button>
        </form>
      </div>
    </div>
  )
}