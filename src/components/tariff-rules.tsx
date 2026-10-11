"use client";

interface Rules {
  base_fee: number;
  minimum_fee: number;
  maximum_fee: number | null;
  tiers: { up_to: number | null; rate_bps: number }[];
  panel_multipliers: Record<string, number>;
}
export const defaultRules: Rules = {
  base_fee: 0,
  minimum_fee: 0,
  maximum_fee: null,
  tiers: [{ up_to: null, rate_bps: 0 }],
  panel_multipliers: {
    "1": 10000,
    "2": 10000,
    "3": 10000,
    "4": 10000,
    "5": 10000,
  },
};
export function TariffRules({
  value,
  onChange,
}: {
  value: Rules;
  onChange: (value: Rules) => void;
}) {
  return (
    <div className="tariff-editor">
      <p className="field-hint">
        مبالغ ریال هستند؛ نرخ ۱۰۰ یعنی یک درصد. ضرایب هیئت با مبنای ۱۰۰۰۰ ثبت
        می‌شوند.
      </p>
      <div className="form-grid">
        {[
          ["base_fee", "مبلغ پایه"],
          ["minimum_fee", "حداقل دستمزد"],
          ["maximum_fee", "سقف دستمزد"],
        ].map(([key, label]) => (
          <label key={key}>
            {label}
            <input
              type="number"
              min={0}
              value={value[key as "base_fee"] ?? ""}
              onChange={(event) =>
                onChange({
                  ...value,
                  [key]:
                    event.target.value === "" && key === "maximum_fee"
                      ? null
                      : Number(event.target.value),
                })
              }
            />
          </label>
        ))}
      </div>
      <h3>پله‌های محاسبه</h3>
      {value.tiers.map((tier, i) => (
        <div className="tier-row" key={i}>
          <label>
            سقف ارزش موضوع
            <input
              type="number"
              min={1}
              placeholder="خالی: بدون سقف"
              value={tier.up_to ?? ""}
              onChange={(event) =>
                onChange({
                  ...value,
                  tiers: value.tiers.map((t, index) =>
                    index === i
                      ? {
                          ...t,
                          up_to: event.target.value
                            ? Number(event.target.value)
                            : null,
                        }
                      : t,
                  ),
                })
              }
            />
          </label>
          <label>
            نرخ
            <input
              type="number"
              min={0}
              max={10000}
              value={tier.rate_bps}
              onChange={(event) =>
                onChange({
                  ...value,
                  tiers: value.tiers.map((t, index) =>
                    index === i
                      ? { ...t, rate_bps: Number(event.target.value) }
                      : t,
                  ),
                })
              }
            />
          </label>
          <button
            type="button"
            className="danger-link"
            disabled={value.tiers.length === 1}
            onClick={() =>
              onChange({
                ...value,
                tiers: value.tiers.filter((_, index) => i !== index),
              })
            }
          >
            حذف پله
          </button>
        </div>
      ))}
      <button
        type="button"
        className="secondary-button"
        disabled={value.tiers.length >= 20}
        onClick={() =>
          onChange({
            ...value,
            tiers: [...value.tiers, { up_to: null, rate_bps: 0 }],
          })
        }
      >
        افزودن پله
      </button>
      <h3>ضریب هیئت کارشناسی</h3>
      <div className="form-grid">
        {Object.entries(value.panel_multipliers).map(([key, multiplier]) => (
          <label key={key}>
            هیئت {key} نفره
            <input
              type="number"
              min={10000}
              max={50000}
              value={multiplier}
              onChange={(event) =>
                onChange({
                  ...value,
                  panel_multipliers: {
                    ...value.panel_multipliers,
                    [key]: Number(event.target.value),
                  },
                })
              }
            />
          </label>
        ))}
      </div>
    </div>
  );
}
