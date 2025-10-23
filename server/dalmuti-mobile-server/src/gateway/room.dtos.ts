import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsInt()
  @Min(2)
  @Max(16)
  maxPlayers!: number;
}

export class JoinRoomDto {
  @IsString()
  @IsNotEmpty()
  roomId!: string;
}

export class LeaveRoomDto {
  @IsString()
  @IsNotEmpty()
  roomId!: string;
}

export class ListRoomsDto {
  // placeholder if paging/filtering needed later
  @IsOptional()
  @IsString()
  q?: string;
}

