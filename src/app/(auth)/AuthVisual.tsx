import { Bike, Package, Pizza, ShoppingBag, Truck } from "lucide-react";

const icons = [
  { Icon: Bike, className: "left-[8%] top-[18%] h-10 w-10 rotate-[-10deg]" },
  { Icon: Package, className: "right-[12%] top-[14%] h-12 w-12 rotate-12" },
  { Icon: ShoppingBag, className: "left-[18%] bottom-[16%] h-11 w-11 rotate-6" },
  { Icon: Truck, className: "right-[20%] bottom-[18%] h-12 w-12 rotate-[-8deg]" },
  { Icon: Pizza, className: "left-[50%] top-[10%] h-9 w-9 rotate-12" },
  { Icon: Package, className: "right-[7%] top-[48%] h-10 w-10 rotate-[-14deg]" },
  { Icon: Bike, className: "left-[6%] bottom-[38%] h-9 w-9 rotate-12" },
];

export function AuthVisual() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#f8fafc_0%,#edf1f6_100%)]" />
      <div className="absolute left-1/2 top-24 h-64 w-64 -translate-x-1/2 rounded-full bg-slate-200/45 blur-3xl" />
      <div className="absolute -left-20 bottom-10 h-56 w-56 rounded-full bg-slate-300/35 blur-3xl" />
      <div className="absolute -right-16 top-20 h-52 w-52 rounded-full bg-slate-200/60 blur-3xl" />
      {icons.map(({ Icon, className }, index) => (
        <div key={index} className={`absolute grid place-items-center rounded-full bg-slate-200/45 text-slate-400/45 ${className}`}>
          <Icon className="h-[58%] w-[58%]" strokeWidth={1.5} />
        </div>
      ))}
    </div>
  );
}
