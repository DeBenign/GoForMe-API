import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, LocateFixed, X } from "lucide-react"
import api from "../lib/api"
import { formatNaira } from "../lib/format"

const CATEGORIES = [
  { value: "grocery", label: "Grocery" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "document", label: "Documents" },
  { value: "food", label: "Food" },
  { value: "bank", label: "Bank" },
  { value: "office", label: "Office" },
  { value: "other", label: "Other" },
]

export default function NewErrand() {
  const navigate = useNavigate()
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("other")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [pickupAddress, setPickupAddress] = useState("")
  const [pickupCoords, setPickupCoords] = useState(null)
  const [dropoffAddress, setDropoffAddress] = useState("")
  const [locating, setLocating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [promoCode, setPromoCode] = useState("")
  const [promoChecking, setPromoChecking] = useState(false)
  const [promoResult, setPromoResult] = useState(null) // { discount, finalAmount } | null
  const [promoError, setPromoError] = useState(null)

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Your browser doesn't support location — enter the address manually below.")
      return
    }
    setLocating(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPickupCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocating(false)
      },
      () => {
        setError("Couldn't get your location. You can still type the address below.")
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return
    if (!price || Number(price) <= 0) {
      setPromoError("Enter what you'll pay first, then apply the code.")
      return
    }
    setPromoChecking(true)
    setPromoError(null)
    setPromoResult(null)
    try {
      const { data } = await api.post("/promos/preview", {
        code: promoCode.trim(),
        orderValue: Number(price),
      })
      setPromoResult({ discount: data.discount, finalAmount: data.finalAmount })
    } catch (err) {
      setPromoError(err.response?.data?.error || "That code didn't work.")
    } finally {
      setPromoChecking(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!pickupCoords) {
      setError("Tap \"Use my current location\" so your runner knows where to start.")
      return
    }
    if (!price || Number(price) <= 0) {
      setError("Enter what you'll pay for this errand.")
      return
    }

    setSaving(true)
    try {
      const { data } = await api.post("/orders", {
        title,
        category,
        description,
        price: Number(price),
        pickup_location: { ...pickupCoords, address: pickupAddress },
        dropoff_location: dropoffAddress ? { address: dropoffAddress } : undefined,
        promoCode: promoResult ? promoCode.trim() : undefined,
      })
      if (!data.success) {
        setError(data.message || "Couldn't create this errand.")
        return
      }
      navigate(`/orders/${data.data._id}`)
    } catch (err) {
      const resErr = err.response?.data
      if (resErr?.shortfall !== undefined) {
        setError(
          `Your wallet balance is ${formatNaira(resErr.currentBalance)} — you're short ${formatNaira(resErr.shortfall)}. Top up your wallet first.`
        )
      } else {
        setError(resErr?.message || "Couldn't create this errand.")
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-hairline bg-base/90 px-5 py-3.5 backdrop-blur">
        <button onClick={() => navigate(-1)} className="text-faint hover:text-ink">
          <ArrowLeft size={18} />
        </button>
        <span className="font-display text-sm font-semibold text-ink">New errand</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 px-5 py-5">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
            Give it a short name
          </label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Pharmacy pickup"
            className="w-full rounded-lg border border-hairline bg-panel px-3.5 py-2.5 text-sm text-ink placeholder:text-faint focus:border-amber focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">Category</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                type="button"
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  category === c.value
                    ? "border-amber bg-amber-dim text-amber"
                    : "border-hairline bg-panel text-muted hover:text-ink"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
            What do you need done?
          </label>
          <textarea
            required
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Pick up my prescription at MedPlus on Ahmadu Bello Way, and 2 packs of paracetamol"
            className="w-full resize-none rounded-lg border border-hairline bg-panel px-3.5 py-2.5 text-sm text-ink placeholder:text-faint focus:border-amber focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
            Pickup location
          </label>
          <button
            type="button"
            onClick={useMyLocation}
            disabled={locating}
            className={`flex w-full items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
              pickupCoords
                ? "border-good/30 bg-good-dim text-good"
                : "border-hairline bg-panel text-muted hover:text-ink"
            }`}
          >
            <LocateFixed size={15} />
            {locating ? "Finding you…" : pickupCoords ? "Location captured ✓" : "Use my current location"}
          </button>
          <input
            value={pickupAddress}
            onChange={(e) => setPickupAddress(e.target.value)}
            placeholder="Landmark or address (optional, helps your runner)"
            className="mt-2 w-full rounded-lg border border-hairline bg-panel px-3.5 py-2.5 text-sm text-ink placeholder:text-faint focus:border-amber focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
            Drop-off (optional)
          </label>
          <input
            value={dropoffAddress}
            onChange={(e) => setDropoffAddress(e.target.value)}
            placeholder="Where should it be delivered?"
            className="w-full rounded-lg border border-hairline bg-panel px-3.5 py-2.5 text-sm text-ink placeholder:text-faint focus:border-amber focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
            What you'll pay
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm text-faint">₦</span>
            <input
              type="number"
              min="100"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="2500"
              className="w-full rounded-lg border border-hairline bg-panel py-2.5 pl-8 pr-3.5 font-mono text-sm text-ink placeholder:text-faint focus:border-amber focus:outline-none"
            />
          </div>
          <p className="mt-1.5 text-xs text-faint">
            This covers the item cost plus your runner's fee. It's held from your wallet balance until the errand is done.
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
            Promo code (optional)
          </label>
          <div className="flex gap-2">
            <input
              value={promoCode}
              onChange={(e) => {
                setPromoCode(e.target.value.toUpperCase())
                setPromoResult(null)
                setPromoError(null)
              }}
              placeholder="e.g. WELCOME10"
              className="flex-1 rounded-lg border border-hairline bg-panel px-3.5 py-2.5 font-mono text-sm text-ink placeholder:text-faint placeholder:font-sans focus:border-amber focus:outline-none"
            />
            <button
              type="button"
              onClick={handleApplyPromo}
              disabled={promoChecking || !promoCode.trim()}
              className="shrink-0 rounded-lg border border-hairline px-4 text-sm font-medium text-muted transition-colors hover:border-amber hover:text-amber disabled:opacity-50"
            >
              {promoChecking ? "Checking…" : "Apply"}
            </button>
          </div>
          {promoResult && (
            <p className="mt-1.5 text-xs text-good">
              {formatNaira(promoResult.discount)} off — you'll pay {formatNaira(promoResult.finalAmount)}.
            </p>
          )}
          {promoError && <p className="mt-1.5 text-xs text-bad">{promoError}</p>}
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-bad/30 bg-bad-dim px-3 py-2.5 text-xs text-bad">
            <X size={13} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-amber py-2.5 text-sm font-semibold text-[#1a1206] hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Sending your errand…" : "Find me a runner"}
        </button>
      </form>
    </div>
  )
}