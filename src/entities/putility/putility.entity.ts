/**
 *  Entity representing a public utility.
 *  This is stored from the API/Web call we make
 *  it is a record of the current "best" rate utility. to show to user in the FE at a later time
 */
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class PUtility {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('decimal', { precision: 10, scale: 5 })
  rate: number;

  @Column()
  type: string;

  @Column({ nullable: true})
  url: string;

  // Number of months this is valid for
  @Column({ nullable: true})
  rateLength: number;
}
