import Image from "next/image";

import "./pwa-loading.css";

export default function Loading() {
	return (
		<div className="pwa-loading-screen" role="status" aria-live="polite">
			<div className="pwa-loading-card">
				<Image
					className="pwa-loading-draco"
					src="/images/welcomePage/dracoWitch1.png"
					alt=""
					width={320}
					height={320}
					priority
				/>
				<p className="pwa-loading-title">loading...</p>
			</div>
		</div>
	);
}
