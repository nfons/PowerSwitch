import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { utilityType }  from  '../../entities/utlityType.enum';

@Entity()
export class CurrentUtility {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'datetime', nullable: true })
  duration: Date;
å
  @Column('decimal', { precision: 10, scale: 5 })
  rate: number;

  @Column()
  type: string;

  @Column('simple-json')
  fields: any;
}
