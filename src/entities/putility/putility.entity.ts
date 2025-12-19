import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class PUtility {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('decimal', { precision: 10, scale: 2 })
  rate: number;

  @Column()
  type: string;
}
