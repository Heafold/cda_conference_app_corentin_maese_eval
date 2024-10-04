import { Executable } from "../../core/executable.interface"
import { User } from "../../user/entities/user.entity"
import { ConferenceNotFoundException } from "../exceptions/conference-not-found"
import { ConferenceUpdateForbiddenException } from "../exceptions/conference-update-forbidden"
import { IConferenceRepository } from "../ports/conference-repository.interface"
import { IBookingRepository } from "../ports/booking-repository.interface"

type RequestChangeSeats = {
    user: User,
    conferenceId: string,
    seats: number
}

type ResponseChangeSeats = void

export class ChangeSeats implements Executable<RequestChangeSeats, ResponseChangeSeats> {
    constructor(
        private readonly repository: IConferenceRepository,
        private readonly bookingRepository: IBookingRepository
    ) {}

    async execute({user, conferenceId, seats }) {
        const conference = await this.repository.findById(conferenceId)

        if(!conference) throw new ConferenceNotFoundException()

        if(conference.props.organizerId !== user.props.id) throw new ConferenceUpdateForbiddenException()

        const bookings = await this.bookingRepository.findByConferenceId(conferenceId)
        if (seats < bookings.length) {
            throw new Error("Cannot reduce seats below the number of existing bookings")
        }

        conference.update({seats})

        if(conference.hasNotEnoughSeats() || conference.hasTooManySeats()) {
            throw new Error("The conference must have a maximum of 1000 seats and minimum of 20 seats")
        }

        await this.repository.update(conference)
    }
}