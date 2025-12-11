use starknet::ContractAddress;

// define the interface
#[starknet::interface]
pub trait IRandomTest<T> {
    fn set_random(ref self: T);
    fn get_random(self: @T) -> felt252;
}

#[starknet::interface]
trait IVrfProvider<TContractState> {
    fn request_random(self: @TContractState, caller: ContractAddress, source: Source);
    fn consume_random(ref self: TContractState, source: Source) -> felt252;
}

#[derive(Drop, Copy, Clone, Serde)]
pub enum Source {
    Nonce: ContractAddress,
    Salt: felt252,
}

#[derive(Drop, Copy, Clone, Serde)]
#[dojo::model]
pub struct Random {
    #[key]
    pub owner: ContractAddress,
    pub value: felt252,
}

#[dojo::contract]
pub mod random_test {
    use starknet::get_caller_address;
    use dojo::model::ModelStorage;
    use super::{IVrfProviderDispatcher, IVrfProviderDispatcherTrait, Source, Random};

    #[abi(embed_v0)]
    impl RandomTestImpl of super::IRandomTest<ContractState> {
        fn set_random(ref self: ContractState) {
            let mut world = self.world(@"dojo_starter");
            let caller = get_caller_address();

            let vrf_provider = IVrfProviderDispatcher { contract_address: 0x051fea4450da9d6aee758bdeba88b2f665bcbf549d2c61421aa724e9ac0ced8f.try_into().unwrap() };
            let value = vrf_provider.consume_random(Source::Nonce(caller));
            println!("value: {}", value);
            world.write_model(@Random { owner: caller, value });
        }

        fn get_random(self: @ContractState) -> felt252 {
            let world = self.world(@"dojo_starter");
            let caller = get_caller_address();
            let random: Random = world.read_model(caller);
            random.value
        }
    }
}
