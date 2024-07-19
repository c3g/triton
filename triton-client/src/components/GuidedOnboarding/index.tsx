import JoyRide, { Step } from "react-joyride"

export default function GuidedOnboarding({ step }: Step[] | any) {
    return <JoyRide steps={step} run={true} continuous={true} />
}
