import { AnimatedGradientText } from "./animated-gradient-text";
import { LogoWithText } from "../logo";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  rightContent?: React.ReactNode;
  titleSuffix?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  rightContent,
  titleSuffix,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-8", className)}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="flex-1 min-w-0">
          {/* Logo on mobile, text on desktop */}
          <div className="block sm:hidden mb-4">
            <LogoWithText size={60} />
          </div>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h1 className="text-3xl sm:text-4xl font-bold">
              <AnimatedGradientText>{title}</AnimatedGradientText>
            </h1>
            {titleSuffix}
          </div>
          {subtitle && (
            <div className="text-zinc-400 text-sm sm:text-base">{subtitle}</div>
          )}
        </div>
        {rightContent && (
          <div className="flex-shrink-0">{rightContent}</div>
        )}
      </div>
    </div>
  );
}
