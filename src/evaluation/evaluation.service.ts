import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Evaluation } from './entities/evaluation.entity';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { User } from '../user/entities/user.entity';
import { Lab } from '../lab/entities/lab.entity';

@Injectable()
export class EvaluationService {
  constructor(
    @InjectRepository(Evaluation)
    private evaluationRepository: Repository<Evaluation>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Lab)
    private labRepository: Repository<Lab>,
  ) {}

  async create(user: User, createDto: CreateEvaluationDto) {
    const lab = await this.labRepository.findOne({
      where: { id: createDto.labId },
    });

    if (!lab) {
      throw new NotFoundException('实验室不存在');
    }

    const evaluation = this.evaluationRepository.create({
      ...createDto,
      user,
      lab,
    });

    const savedEvaluation = await this.evaluationRepository.save(evaluation);

    // 更新实验室评分
    await this.updateLabRating(createDto.labId);

    return savedEvaluation;
  }

  async findByLab(labId: string) {
    return await this.evaluationRepository.find({
      where: { lab: { id: labId } },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateLabRating(labId: string) {
    const evaluations = await this.evaluationRepository.find({
      where: { lab: { id: labId } },
    });

    if (evaluations.length === 0) {
      return;
    }

    const totalRating = evaluations.reduce(
      (sum, item) => sum + item.overallRating,
      0,
    );
    const averageRating = totalRating / evaluations.length;

    await this.labRepository.update(labId, {
      rating: Number(averageRating.toFixed(2)),
    });
  }

  async getStatistics(labId: string) {
    const evaluations = await this.findByLab(labId);

    if (evaluations.length === 0) {
      return {
        totalCount: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    evaluations.forEach((item) => {
      ratingDistribution[item.overallRating] += 1;
    });

    const totalRating = evaluations.reduce(
      (sum, item) => sum + item.overallRating,
      0,
    );
    const averageRating = totalRating / evaluations.length;

    return {
      totalCount: evaluations.length,
      averageRating: averageRating.toFixed(2),
      ratingDistribution,
    };
  }
}
