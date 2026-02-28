interface InlineEmbedFrameProps {
	src: string;
	title: string;
	heightClass: string;
	borderClass: string;
}

export function InlineEmbedFrame({
	src,
	title,
	heightClass,
	borderClass,
}: InlineEmbedFrameProps) {
	return (
		<div
			className={`relative w-full overflow-hidden border-b ${borderClass} ${heightClass}`}
		>
			<iframe
				title={title}
				src={src}
				className="h-full w-full border-0 bg-white"
				loading="lazy"
				allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
				referrerPolicy="strict-origin-when-cross-origin"
			/>
		</div>
	);
}
