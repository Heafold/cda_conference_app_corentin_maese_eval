import { Db, ObjectId } from 'mongodb';
import { Conference } from '../../entities/conference.entity';
import { IConferenceRepository } from '../../ports/conference-repository.interface';

export class MongoConferenceRepository implements IConferenceRepository {
    constructor(private db: Db) {}

    async create(conference: Conference): Promise<void> {
        const { id, ...conferenceProps } = conference.props;
        await this.db.collection('conferences').insertOne({
            _id: new ObjectId(id),
            ...conferenceProps
        });
    }

    async findById(id: string): Promise<Conference | null> {
        const conferenceData = await this.db.collection('conferences').findOne({ _id: new ObjectId(id) });
        if (!conferenceData) return null;
        
        const conferenceProps = {
            id: conferenceData._id.toHexString(),
            organizerId: conferenceData.organizerId,
            title: conferenceData.title,
            startDate: new Date(conferenceData.startDate),
            endDate: new Date(conferenceData.endDate),
            seats: conferenceData.seats
        };

        return new Conference(conferenceProps);
    }

    async update(conference: Conference): Promise<void> {
        const { id, ...updateProps } = conference.props;
        await this.db.collection('conferences').updateOne(
            { _id: new ObjectId(id) },
            { $set: updateProps }
        );
    }
}