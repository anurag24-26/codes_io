import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const steps = [
  { title: "Add your menu", desc: "Create categories and items with prices, photos, and descriptions." },
  { title: "Generate QR", desc: "Every restaurant gets one permanent QR code — download it in one click." },
  { title: "Place it on your tables", desc: "Print the QR once. Update your menu anytime; the QR never changes." },
];

const freeFeatures = [
  "1 restaurant",
  "Up to 3 categories",
  "Up to 20 menu items",
  "Food images",
  "Public menu page",
  "Basic QR + PNG download",
];

const proFeatures = [
  "Unlimited restaurants",
  "Unlimited categories & items",
  "Custom logo & branding",
  "Remove \"Powered by Codes.io\"",
  "Menu analytics",
  "Featured items & special offers",
];

export function LandingPage() {
  return (
    <div>
      <section className="border-b border-neutral-200 bg-white">
        <div className="container-page flex flex-col items-center gap-6 py-20 text-center">
          <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl">
            Create your digital restaurant menu in minutes.
          </h1>
          <p className="max-w-xl text-lg text-neutral-600">
            Add your menu, generate a QR code, and let customers view it instantly.
          </p>
          <Link to="/register">
            <Button size="lg">Create Your Menu</Button>
          </Link>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="grid gap-6 sm:grid-cols-3">
          {steps.map((step, i) => (
            <Card key={step.title} className="text-center">
              <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                {i + 1}
              </div>
              <h3 className="font-semibold text-neutral-900">{step.title}</h3>
              <p className="mt-1 text-sm text-neutral-600">{step.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-neutral-50 py-16">
        <div className="container-page">
          <h2 className="text-center text-2xl font-bold text-neutral-900">Simple pricing</h2>
          <div className="mx-auto mt-8 grid max-w-3xl gap-6 sm:grid-cols-2">
            <Card>
              <h3 className="text-lg font-semibold">Free</h3>
              <p className="mt-1 text-sm text-neutral-500">Everything you need to get started.</p>
              <ul className="mt-4 space-y-2 text-sm text-neutral-700">
                {freeFeatures.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-emerald-600">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link to="/register" className="mt-6 block">
                <Button variant="outline" className="w-full">
                  Get started free
                </Button>
              </Link>
            </Card>
            <Card className="border-brand-200 ring-1 ring-brand-100">
              <h3 className="text-lg font-semibold text-brand-700">Pro</h3>
              <p className="mt-1 text-sm text-neutral-500">For growing restaurants and multi-location owners.</p>
              <ul className="mt-4 space-y-2 text-sm text-neutral-700">
                {proFeatures.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-emerald-600">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link to="/register" className="mt-6 block">
                <Button className="w-full">Upgrade to Pro</Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
