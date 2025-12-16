import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { GST_RATES } from "../../constants/tax";

interface GSTRateSelectProps {
    value: string | number;
    onValueChange: (value: string) => void;
    className?: string;
    triggerClassName?: string;
    showLabel?: boolean;
}

export function GSTRateSelect({
    value,
    onValueChange,
    className,
    triggerClassName,
    showLabel = true
}: GSTRateSelectProps) {
    return (
        <Select value={value.toString()} onValueChange={onValueChange}>
            <SelectTrigger className={triggerClassName || "h-9"}>
                <SelectValue placeholder="Select GST Rate" />
            </SelectTrigger>
            <SelectContent className={className}>
                {GST_RATES.map((rate) => (
                    <SelectItem key={rate.value} value={rate.value}>
                        {showLabel ? rate.label : `${rate.rate}%`}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
