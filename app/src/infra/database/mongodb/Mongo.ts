import IRepository from '../../../domain/repositories/IRepository';
import { MongoClient, Db, Collection } from 'mongodb';

export default class Mongo<Entity> implements IRepository<Entity> {
    
    private host : string;
    private database : string
    private optionsConnect: { useNewUrlParser: boolean; };
    private collectionName : string;
    private static client? : MongoClient

    constructor(collectionName : string) {
        this.host = process.env.MONGO_DB_HOST || 'mongodb://localhost:27017';
        this.database = process.env.MONGO_DB_DATABASE || 'kontafit';
        this.optionsConnect = {
            useNewUrlParser: true,
        };
        this.collectionName = collectionName;
    }

    get db() : Db {
        return Mongo.client!.db(this.database);
    }

    get collection() : Collection {
        return this.db.collection(this.collectionName);
    }

    async connect() : Promise<void> {
        if(Mongo.client && Mongo.client!.isConnected()) return;
        const mongoClient = new MongoClient(this.host, this.optionsConnect);
        Mongo.client = await mongoClient.connect();
    }

    async disconect() : Promise<void> {
        await Mongo.client!.close();
    }

    async find(): Promise<Entity[]> {        
        await this.connect();
        const data = await this.collection.find<Entity>().toArray();
        await this.disconect();
        return data;
    }
    
    async findById(identify: string): Promise<Entity|null> {
        await this.connect();
        const data = await this.collection.findOne<Entity>({ id: identify });
        await this.disconect();
        return data;
    }
    
    async insert(data: Entity): Promise<Entity|null> {
        await this.connect();
        const result = await this.collection.insertOne(data);
        const responseSearch = await this.findById(String(result.insertedId))
        await this.disconect();
        return responseSearch;
    }
    
    async update(identify: string, data: Entity): Promise<Entity|null> {
        await this.connect();
        await this.collection.updateOne({ id: identify }, data);
        const responseSearch = await this.findById(identify);
        await this.disconect();
        return responseSearch;

    }
    
    async delete(identify: string): Promise<Boolean> {
        await this.connect();
        const result = await this.collection.deleteOne({ id: identify })
        
        if(result.deletedCount && result.deletedCount > 0) {
            return true;
        }

        return false;
    }   
}