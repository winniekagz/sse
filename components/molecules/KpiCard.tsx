"use client";

import { motion, useReducedMotion } from "framer-motion";

import { KpiValue } from "@/components/atoms/KpiValue";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type KpiCardProps = {
  label: string;
  value: string;
  unit?: string;
  helper?: string;
};

export function KpiCard({ label, value, unit, helper }: KpiCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <Card className="border-slate-200">
      <CardHeader className="space-y-2">
        <CardTitle className="text-sm text-slate-600">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <motion.div
          key={value}
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 180, damping: 18 }}
        >
          <KpiValue value={value} unit={unit} />
        </motion.div>
        {helper ? <p className="text-xs text-slate-500">{helper}</p> : null}
      </CardContent>
    </Card>
  );
}
