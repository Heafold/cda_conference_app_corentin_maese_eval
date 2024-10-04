import { Executable } from "../../core/executable.interface";
import { User } from "../../user/entities/user.entity";
import { Booking } from "../entities/booking.entity";
import { ConferenceNotFoundException } from "../exceptions/conference-not-found";
import { IBookingRepository } from "../ports/booking-repository.interface";
import { IConferenceRepository } from "../ports/conference-repository.interface";
import { IIDGenerator } from "../../core/ports/id-generator.interface";

type BookSeatRequest = {
    user: User;
    conferenceId: string;
};

type BookSeatResponse = {
    bookingId: string;
};

export class BookSeat implements Executable<BookSeatRequest, BookSeatResponse> {
    constructor(
        private readonly conferenceRepository: IConferenceRepository,
        private readonly bookingRepository: IBookingRepository,
        private readonly idGenerator: IIDGenerator
    ) {}

    async execute({ user, conferenceId }: BookSeatRequest): Promise<BookSeatResponse> {
        const conference = await this.conferenceRepository.findById(conferenceId);
        if (!conference) {
            throw new ConferenceNotFoundException();
        }

        const existingBookings = await this.bookingRepository.findByConferenceId(conferenceId);
        if (existingBookings.length >= conference.props.seats) {
            throw new Error("No more seats available for this conference");
        }

        const booking = new Booking({
            id: this.idGenerator.generate(),
            userId: user.props.id,
            conferenceId: conferenceId,
        });

        await this.bookingRepository.create(booking);

        return { bookingId: booking.props.id };
    }
}