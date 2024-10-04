import { Entity } from "../../core/entities/entity"

type BookingProps = {
    id: string
    userId: string
    conferenceId: string
}

export class Booking extends Entity<BookingProps> {
    
}