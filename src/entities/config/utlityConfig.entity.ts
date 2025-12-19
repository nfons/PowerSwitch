import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class UtilityConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'datetime', nullable: true })
  nextrun: Date;

  @Column('simple-json')
  fields: any;
}
