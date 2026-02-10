# RADStrat v1 - Demo Account Credentials

> Generated: 2026-02-10
> Environment: Development (local + RDS)
> Password hashing: Argon2id (19 MiB, 2 iterations)

## Admin Accounts

| Email | Name | Password | Role |
|-------|------|----------|------|
| jacintayee98@gmail.com | Jacinta Yee | admin_admin01 | SUPER_ADMIN |
| eugene.tan@magesstudio.com.sg | Eugene Tan | MAGESCR1 | SUPER_ADMIN |

## Player Accounts

| Email | Name | Password | Status |
|-------|------|----------|--------|
| wei.ming.tan@demo.radstrat.mil.sg | Wei Ming Tan | qAn8S6*6kjpA | Active |
| jun.hao.lim@demo.radstrat.mil.sg | Jun Hao Lim | Am%6sD%Lb$ | Active |
| kai.wen.ng@demo.radstrat.mil.sg | Kai Wen Ng | 6UnkREeW*h | Active |
| zhi.hao.chen@demo.radstrat.mil.sg | Zhi Hao Chen | d%$Uz5e4 | Active |
| yi.xuan.wong@demo.radstrat.mil.sg | Yi Xuan Wong | UEA8@65DHa@A | Active |
| jia.le.ong@demo.radstrat.mil.sg | Jia Le Ong | qg%qW72k7Tb@ | Active |
| rui.en.koh@demo.radstrat.mil.sg | Rui En Koh | yFb8YNN#NqU | Active |
| shi.ting.goh@demo.radstrat.mil.sg | Shi Ting Goh | TPhC544*#M | Active |
| ming.wei.chua@demo.radstrat.mil.sg | Ming Wei Chua | XWn5&XJh | Inactive |
| jia.hui.lee@demo.radstrat.mil.sg | Jia Hui Lee | cku9UzD*S52 | Inactive |

## Notes

- All passwords are unique per player (8-12 characters, uppercase + lowercase + digit + symbol)
- Passwords are hashed with Argon2id in the database (OWASP-compliant parameters)
- Re-running `pnpm db:seed` will regenerate new passwords (this document will need updating)
- Player accounts 9-10 (Ming Wei Chua, Jia Hui Lee) are set to **inactive** for testing deactivation flows
- Each player has seeded progress data, initial assessment scores, and game events within the last 5 days
