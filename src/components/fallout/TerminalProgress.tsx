"use client"

interface TerminalProgressProps {
    isProcessing?: boolean
    className?: string
}

export function TerminalProgress({ isProcessing = false, className = '' }: TerminalProgressProps) {
    return (
        <div className={`flex flex-col items-center gap-2 ${className}`}>
            <div className="fo-stat-bar w-32">
                <div 
                    className={`fo-stat-bar-fill ${isProcessing ? 'fo-processing-bar' : 'w-0'}`}
                />
            </div>
            <div className="fo-text text-sm uppercase tracking-widest">
                {isProcessing ? (
                    <span>Processing<span className="fo-loading-dots"></span></span>
                ) : (
                    'Ready'
                )}
            </div>
        </div>
    )
}
