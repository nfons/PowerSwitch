/**
 *  Entity representing a public utility.
 *  This is stored from the API/Web call we make
 *  it is a record of the current "best" rate utility. to show to user in the FE at a later time
 */
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
@Entity()
export class PUtility {
  /**
   * ID of the utility record
   * Auto Generated
   * @example 1
   */
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Name of the utility',
    example: 'Electricity Provider',
  })
  @Column()
  name: string;

  @ApiProperty({
    description: 'Rate of the utility',
    example: '0.25',
    type: 'number',
  })
  @Column('decimal', { precision: 10, scale: 5 })
  rate: number;

  @ApiProperty({
    description: 'Type of utility',
    example: 'Electricity',
    enum: ['Electricity', 'Gas'],
  })
  @Column()
  type: string;

  @ApiProperty({
    description: 'Url of provider',
    example: 'https://provider.com/rate-info',
  })
  @Column({ nullable: true })
  url: string;

  @ApiProperty({
    description: 'Number of months this rate is valid for',
    example: 12,
    nullable: true,
  })
  @Column({ nullable: true })
  rateLength: number;

  @ApiProperty({
    description: 'timestamp of record creation',
    example: '2024-01-01T00:00:00Z',
  })
  @CreateDateColumn()
  createdAt: Date;
}
