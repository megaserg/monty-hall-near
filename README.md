# Monty Hall game as a NEAR contract 🚪🐐💰

Simple simulation of the [Monty Hall show](https://en.wikipedia.org/wiki/Monty_Hall_problem). You're given the choice of three doors: Behind one door is a prize; behind the others, goats. You pick a door and the host opens another door, which has a goat. Do you want to switch your choice?
## Usage

### Prepare

1. Clone this repo to a local folder
1. Run `yarn`
1. Run `./scripts/1.dev-deploy.sh`
1. Export the contract ID like `export CONTRACT=dev-123123-123123`
1. If running for the first time, init with `near call $CONTRACT init --accountId $CONTRACT`

### Play
1. Start the game using the `start_game` method: `near call $CONTRACT start_game --accountId $CONTRACT --amount 1`. `1` stands for `1 NEAR`, minimum payment to play the game. After the game is started, your payment is added to the total pot.
1. Make your choice of the door using the `make_turn` method: `near call $CONTRACT make_turn --accountId $CONTRACT '{"choice": 2}'`. Here, `2` stands for door #2.
1. Another door will open and you will be offered to switch your choice. Either keep your previous choice, or change it, using the same `make_turn` method: `near call $CONTRACT make_turn --accountId $CONTRACT '{"choice": 3}' --gas 75000000000000`. Here, `3` stands for door #3. For some reason, in case you win, the default "prepaid gas" is not enough and results in a confusing message `Transaction ... had 30000000000000 of attached gas but used 2427967954614 of gas`.
1. At this point, all doors will open. If the prize was behind your chosen door, you win! Otherwise, you get nothing. Good luck next time!

### Cleanup
1. Run `./scripts/3.cleanup.sh`

### Development
- If you made changes to just the logic, run `./scripts/1.dev-deploy.sh` again.
- If you made changes to the data model, run `./scripts/3.cleanup.sh` and re-run all preparation steps just to be safe.
- If something goes wrong during the game, call `near call $CONTRACT reset --accountId $CONTRACT` to reset the game state to after-init.

### Videos

**`1.dev-deploy.sh`**

This video shows the build and deployment of the contract.

[![asciicast](https://asciinema.org/a/409575.svg)](https://asciinema.org/a/409575)

**`2.use-contract.sh`**

This video shows contract methods being called.  You should run the script twice to see the effect it has on contract state.

[![asciicast](https://asciinema.org/a/409577.svg)](https://asciinema.org/a/409577)

**`3.cleanup.sh`**

This video shows the cleanup script running.  Make sure you add the `BENEFICIARY` environment variable. The script will remind you if you forget.

```sh
export BENEFICIARY=<your-account-here>   # this account receives contract account balance
```
