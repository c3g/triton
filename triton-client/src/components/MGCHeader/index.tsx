import genomeLogo from "@static/genome-logo.jpg"

export const MGCHeader = () => {
    return <div className="mgc-header">
        <img
            alt="McGill Genome Center"
            height="40px"
            src={genomeLogo} />
    </div>
}
