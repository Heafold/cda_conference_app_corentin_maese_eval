import { BookSeat } from "./book-seat";
import { InMemoryConferenceRepository } from "../adapters/in-memory-conference-repository";
import { InMemoryBookingRepository } from "../adapters/in-memory-booking-repository";
import { FixedIDGenerator } from "../../core/adapters/fixed-id-generator";
import { testUsers } from "../../user/tests/user-seeds";
import { testConference } from "../tests/conference-seeds";
import { Conference } from "../entities/conference.entity";
import { Booking } from "../entities/booking.entity";

describe("Feature: Book a seat", () => {
    let conferenceRepository: InMemoryConferenceRepository;
    let bookingRepository: InMemoryBookingRepository;
    let idGenerator: FixedIDGenerator;
    let useCase: BookSeat;

    beforeEach(() => {
        conferenceRepository = new InMemoryConferenceRepository();
        bookingRepository = new InMemoryBookingRepository();
        idGenerator = new FixedIDGenerator();
        useCase = new BookSeat(conferenceRepository, bookingRepository, idGenerator);
    });

    describe("Scenario: Happy path", () => {
        beforeEach(async () => {
            await conferenceRepository.create(testConference.conference1);
        });

        it("should book a seat successfully", async () => {
            const result = await useCase.execute({
                user: testUsers.bob,
                conferenceId: testConference.conference1.props.id,
            });

            expect(result).toEqual({ bookingId: "id-1" });
            expect(bookingRepository.database).toHaveLength(1);
            expect(bookingRepository.database[0].props).toEqual({
                id: "id-1",
                userId: testUsers.bob.props.id,
                conferenceId: testConference.conference1.props.id,
            });
        });
    });

    describe("Scenario: Conference does not exist", () => {
        it("should throw an error", async () => {
            await expect(
                useCase.execute({
                    user: testUsers.bob,
                    conferenceId: "non-existing-id",
                })
            ).rejects.toThrow("Conference not found");
        });
    });

    describe("Scenario: No more seats available", () => {
        beforeEach(async () => {
            const fullConference = new Conference({
                ...testConference.conference1.props,
                seats: 1,
            });
            await conferenceRepository.create(fullConference);
            await bookingRepository.create(
                new Booking({
                    id: "existing-booking",
                    userId: testUsers.alice.props.id,
                    conferenceId: fullConference.props.id,
                })
            );
        });

        it("should throw an error", async () => {
            await expect(
                useCase.execute({
                    user: testUsers.bob,
                    conferenceId: testConference.conference1.props.id,
                })
            ).rejects.toThrow("No more seats available for this conference");
        });
    });
});