import { Application } from 'express'
import request from 'supertest'
import { IBookingRepository } from '../conference/ports/booking-repository.interface'
import container from '../infrastructure/express_api/config/dependency-injection'
import { e2eConference } from './seeds/conference-seeds'
import { e2eUsers } from './seeds/user-seeds'
import { TestApp } from './utils/test-app'
import { Booking } from '../conference/entities/booking.entity'

describe('Feature: Book a seat', () => {
    let testApp: TestApp
    let app: Application

    beforeEach(async () => {
        testApp = new TestApp()
        await testApp.setup()
        await testApp.loadAllFixtures([e2eUsers.bob, e2eConference.conference1])
        app = testApp.expressApp
    })

    afterAll(async () => {
        await testApp.tearDown()
    })

    it('should book a seat successfully', async () => {
        const result = await request(app)
            .post('/conference/book')
            .set('Authorization', e2eUsers.bob.createAuthorizationToken())
            .send({
                conferenceId: e2eConference.conference1.entity.props.id
            })

        expect(result.status).toBe(201)
        expect(result.body.data).toEqual({
            bookingId: expect.any(String)
        })

        const bookingRepository = container.resolve('bookingRepository') as IBookingRepository
        const bookings = await bookingRepository.findByConferenceId(e2eConference.conference1.entity.props.id)

        expect(bookings).toHaveLength(1)
        expect(bookings[0].props).toEqual({
            id: expect.any(String),
            userId: e2eUsers.bob.entity.props.id,
            conferenceId: e2eConference.conference1.entity.props.id
        })
    })

    it('should return 404 when conference does not exist', async () => {
        const result = await request(app)
            .post('/conference/book')
            .set('Authorization', e2eUsers.bob.createAuthorizationToken())
            .send({
                conferenceId: 'non-existing-id'
            })

        expect(result.status).toBe(404)
    })

    it('should return 400 when no more seats available', async () => {
        const bookingRepository = container.resolve('bookingRepository') as IBookingRepository
        
        for (let i = 0; i < e2eConference.conference1.entity.props.seats; i++) {
            await bookingRepository.create(new Booking({
                id: `existing-booking-${i}`,
                userId: `user-${i}`,
                conferenceId: e2eConference.conference1.entity.props.id
            }))
        }

        const result = await request(app)
            .post('/conference/book')
            .set('Authorization', e2eUsers.bob.createAuthorizationToken())
            .send({
                conferenceId: e2eConference.conference1.entity.props.id
            })

        expect(result.status).toBe(400)
        expect(result.body.error.message).toBe('No more seats available for this conference')
    })
})