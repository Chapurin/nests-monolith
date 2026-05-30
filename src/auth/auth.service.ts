import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { User } from '../common/types/User';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    const comparedPassword =
      (user?.password && (await bcrypt.compare(password, user.password))) ||
      false;

    if (user && comparedPassword) {
      return user;
    }

    throw new UnauthorizedException('Wrong credentials');
  }

  async login(user: User) {
    const { id, email } = user;
    const token = this.jwtService.sign({ id, email });

    return { id, email, token };
  }
}
