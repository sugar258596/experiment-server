import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ReviewAppointmentDto {
  @IsBoolean()
  approved: boolean;

  @IsString()
  @IsOptional()
  reason?: string;
}
