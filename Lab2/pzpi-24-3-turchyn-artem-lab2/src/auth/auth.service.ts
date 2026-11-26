import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { appConfig } from '../config/app.config';
import { User } from '../database/entities';
import { JwtPayload } from './auth.types';
import { LoginDto } from './dto/login.dto';

/** Відповідь на успішний вхід */
export interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: {
    id: number;
    email: string;
    fullName: string;
    role: string;
    locale: string;
  };
}

/** Автентифікація користувачів за email і паролем із видачею JWT-токенів */
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  /** Перевіряє облікові дані та видає JWT-токен доступу */
  async login(dto: LoginDto): Promise<LoginResponse> {
    const user = await this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .innerJoinAndSelect('user.role', 'role')
      .where('user.email = :email', { email: dto.email.toLowerCase() })
      .getOne();
    const passwordMatches = user
      ? await bcrypt.compare(dto.password, user.passwordHash)
      : false;
    if (!user || !passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!user.isActive) {
      throw new ForbiddenException('User is deactivated');
    }
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role.code,
    };
    return {
      accessToken: await this.jwtService.signAsync(payload),
      tokenType: 'Bearer',
      expiresIn: appConfig.jwt.expiresInSeconds,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role.code,
        locale: user.locale,
      },
    };
  }

  /** Повертає профіль поточного користувача */
  async getProfile(userId: number): Promise<User> {
    const user = await this.users.findOne({
      where: { id: userId },
      relations: { role: true },
    });
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }
    return user;
  }
}
