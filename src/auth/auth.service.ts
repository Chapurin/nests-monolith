import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

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
}
