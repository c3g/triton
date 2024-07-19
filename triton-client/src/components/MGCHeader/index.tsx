import { Link } from "react-router-dom"
import genomeLogo from "@static/genome-logo.jpg"
import { Image } from "antd"

export const MGCHeader = () => {
    return (
        <div className="mgc-header">
            <Link to="/">
                <Image
                    alt="McGill Genome Center"
                    preview={false}
                    width={80}
                    src={genomeLogo}
                    className="mgc-header-logo"
                />
            </Link>
        </div>
    )
}

export default MGCHeader
