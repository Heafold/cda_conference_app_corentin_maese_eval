import { MongoClient, Db, ObjectId } from 'mongodb';
import { MongoConferenceRepository } from './mongo-conference-repository';
import { Conference } from '../../entities/conference.entity';
import { testConference } from '../../tests/conference-seeds';
import { TestApp } from '../../../tests/utils/test-app';

describe('MongoConferenceRepository Integration Tests', () => {
    let mongoClient: MongoClient;
    let db: Db;
    let repository: MongoConferenceRepository;
    let testApp: TestApp;

    beforeAll(async () => {
        testApp = new TestApp();
        await testApp.setup();
        
        mongoClient = await MongoClient.connect('mongodb://admin:qwerty@localhost:3702/conferences?authSource=admin');
        db = mongoClient.db('conferences');
        repository = new MongoConferenceRepository(db);
    });

    afterAll(async () => {
        await mongoClient.close();
        await testApp.tearDown();
    });

    beforeEach(async () => {
        await db.collection('conferences').deleteMany({});
    });

    describe('create', () => {
        it('should create a conference in the database', async () => {
            await repository.create(testConference.conference1);

            const savedConference = await db.collection('conferences').findOne({ _id: new ObjectId(testConference.conference1.props.id) });
            expect(savedConference).toBeDefined();
            expect(savedConference?._id.toHexString()).toBe(testConference.conference1.props.id);
        });
    });

    describe('findById', () => {
        it('should find a conference by id', async () => {
            await db.collection('conferences').insertOne({
                _id: new ObjectId(testConference.conference1.props.id),
                ...testConference.conference1.props
            });

            const foundConference = await repository.findById(testConference.conference1.props.id);
            expect(foundConference).toBeDefined();
            expect(foundConference?.props.id).toEqual(testConference.conference1.props.id);
        });

        it('should return null if conference not found', async () => {
            const foundConference = await repository.findById('507f1f77bcf86cd799439011');
            expect(foundConference).toBeNull();
        });
    });

    describe('update', () => {
        it('should update an existing conference', async () => {
            await db.collection('conferences').insertOne({
                _id: new ObjectId(testConference.conference1.props.id),
                ...testConference.conference1.props
            });

            const updatedConference = new Conference({
                ...testConference.conference1.props,
                title: 'Updated Title'
            });

            await repository.update(updatedConference);

            const savedConference = await db.collection('conferences').findOne({ _id: new ObjectId(testConference.conference1.props.id) });
            expect(savedConference).toBeDefined();
            expect(savedConference?.title).toBe('Updated Title');
        });
    });
});