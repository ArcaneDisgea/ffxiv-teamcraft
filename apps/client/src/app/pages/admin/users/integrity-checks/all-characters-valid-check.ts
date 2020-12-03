import { IntegrityCheck } from './integrity-check';
import { combineLatest, Observable, of } from 'rxjs';
import { TeamcraftUser } from 'apps/client/src/app/model/user/teamcraft-user';
import { catchError, map, mapTo } from 'rxjs/operators';
import { CharacterService } from '../../../../core/api/character.service';

export class AllCharactersValidCheck implements IntegrityCheck<number[]> {

  constructor(private characterService: CharacterService) {
  }

  getNameKey(): string {
    return 'All_characters_valid';
  }

  check(user: TeamcraftUser): Observable<number[] | null> {
    const idsToCheck = user.lodestoneIds.filter(l => l.id > 0);
    if (idsToCheck.length === 0) {
      return of(null);
    }
    return combineLatest(
      user.lodestoneIds.map(entry => {
        return this.characterService.getCharacter(entry.id).pipe(
          mapTo(true),
          catchError(() => of(false))
        );
      })
    ).pipe(
      map(results => {
        const invalidIndexes = results
          .map((res, i) => res ? -1 : i)
          .filter(i => i > -1);
        if (invalidIndexes.length === 0) {
          return null;
        }
        return invalidIndexes;
      })
    );
  }

  fix(user: TeamcraftUser, result: number[]): TeamcraftUser {
    if (result === null) {
      return user;
    }
    result.forEach(index => {
      delete user.lodestoneIds[index];
    });
    user.lodestoneIds = user.lodestoneIds.filter(e => e);
    if (user.lodestoneIds.length === 0) {
      delete user.defaultLodestoneId;
    }
    return user;
  }

}
